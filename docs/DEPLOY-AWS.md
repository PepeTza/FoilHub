# FoilHub — Despliegue en AWS con Docker Swarm

Runbook para la tarea B9. Clúster de **3 instancias EC2**: 1 manager + 2 workers. La base de datos queda fijada al manager (etiqueta `db=true`), así se puede vaciar un worker durante la demo sin tocar los datos.

```
                    Internet
                       │ :80 (y :8080 solo desde su IP)
              ┌────────▼────────┐
              │  Elastic IP     │
              │  foilhub-manager│  db (label db=true), visualizer, réplicas de api/nginx
              └───┬─────────┬───┘
       2377/tcp, 7946/tcp+udp, 4789/udp (solo dentro del Security Group)
          ┌───────▼──┐   ┌──▼───────┐
          │ worker-1 │   │ worker-2 │   réplicas de api y nginx
          └──────────┘   └──────────┘
```

## 0. Antes de empezar

- Imágenes `foilhub-api` y `foilhub-nginx` subidas a Docker Hub con un tag (`./scripts/build-push.sh v0.1.0` desde su PC).
- Región de AWS elegida (usen siempre la misma). Revisen en **Billing** cuánto cubre su plan gratuito o sus créditos. Si usan una cuenta de AWS Academy (Learner Lab), revisen sus límites: las sesiones tienen tiempo limitado y pueden detener las instancias al terminar.
- Un **Key Pair** creado en EC2 → Key Pairs (descarguen el `.pem` y hagan `chmod 400 foilhub.pem`).

## 1. Security Group

EC2 → Security Groups → Create: nombre `foilhub-swarm`, en la VPC por defecto.

Reglas de entrada:

| Tipo | Protocolo | Puerto | Origen | Para qué |
|---|---|---|---|---|
| SSH | TCP | 22 | **Mi IP** | Administración |
| HTTP | TCP | 80 | 0.0.0.0/0 | La aplicación |
| Personalizada | TCP | 8080 | **Mi IP** | Visualizer (demo) |
| Personalizada | TCP | 2377 | `foilhub-swarm` (el mismo SG) | Gestión del clúster |
| Personalizada | TCP | 7946 | `foilhub-swarm` | Descubrimiento entre nodos |
| Personalizada | UDP | 7946 | `foilhub-swarm` | Descubrimiento entre nodos |
| Personalizada | UDP | 4789 | `foilhub-swarm` | Tráfico de redes overlay (VXLAN) |

Para que el origen sea el propio SG: créenlo primero solo con SSH y HTTP, guárdenlo, y después editen las reglas de entrada eligiendo como origen el ID `sg-…` del mismo grupo.

Las reglas de salida se dejan como vienen (todo permitido).

## 2. Lanzar las instancias

EC2 → Launch instances, **3 veces** (o una vez con "Number of instances: 3" y luego renombrar):

- Nombres: `foilhub-manager`, `foilhub-worker-1`, `foilhub-worker-2`.
- AMI: **Ubuntu Server 24.04 LTS** (x86_64).
- Tipo: `t3.small` (2 GB de RAM). Con `t3.micro` funciona, pero bajen las réplicas de la API a 2.
- Key pair: el suyo. Security Group: `foilhub-swarm`. Disco: 20 GB gp3.
- Todas en la misma VPC y, de preferencia, la misma subnet.
- **Advanced details → User data**: peguen este script para que Docker se instale solo:

```bash
#!/bin/bash
set -eux
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
usermod -aG docker ubuntu
systemctl enable --now docker
```

## 3. Elastic IP

EC2 → Elastic IPs → Allocate → Associate con `foilhub-manager`. Esa será la dirección pública de la app. (La routing mesh de Swarm hace que el puerto 80 responda en cualquier nodo, pero usamos una sola IP fija.)

## 4. Crear el clúster

Anoten la **IP privada** de cada instancia (consola de EC2, columna "Private IPv4").

En el manager:

```bash
ssh -i foilhub.pem ubuntu@<elastic-ip>
docker version                       # confirma que el user data terminó (si falla, esperen 1–2 min)
docker swarm init --advertise-addr <ip-privada-del-manager>
```

El comando imprime un `docker swarm join --token ... <ip-privada>:2377`. Ejecútenlo en cada worker:

```bash
ssh -i foilhub.pem ubuntu@<ip-publica-del-worker>
docker swarm join --token <token> <ip-privada-del-manager>:2377
```

De vuelta en el manager:

```bash
docker node ls                                        # 3 nodos Ready, el manager como Leader
docker node update --label-add db=true $(docker node ls --filter role=manager -q)
docker node inspect self --format '{{ .Spec.Labels }}' # map[db:true]
```

## 5. Secrets y despliegue

En el manager:

```bash
git clone https://github.com/PepeTza/FoilHub.git && cd FoilHub
./scripts/create-secrets.sh
docker secret ls                                      # db_password, jwt_secret

docker login                                          # solo si los repos de Docker Hub son privados
export REGISTRY=docker.io/<usuario-dockerhub>
./scripts/deploy.sh v1.0.0
```

Verificación:

```bash
docker stack services foilhub          # nginx 2/2, api 3/3, db 1/1, visualizer 1/1
docker service ps foilhub_api          # réplicas repartidas en varios nodos
curl http://localhost/api/health       # {"status":"ok",...}
```

Desde su navegador: `http://<elastic-ip>/` y el visualizer en `http://<elastic-ip>:8080/`.

## 6. Catálogo y datos de demo

```bash
docker service ps foilhub_api --filter desired-state=running   # ¿en qué nodo hay una réplica?
./scripts/import-cards.sh                                       # en un nodo con réplica de la API
docker exec -it $(docker ps -q -f name=foilhub_api | head -1) npm run seed:demo:prod
```

Si `import-cards.sh` dice que no hay contenedores de la API en ese nodo, conéctense por SSH al nodo que indica `docker service ps` y ejecútenlo ahí (el repo no hace falta: basta con el `docker exec`).

## 7. Actualizar a una versión nueva

Desde su PC: `./scripts/build-push.sh v1.0.1`. En el manager:

```bash
./scripts/deploy.sh v1.0.1                                   # actualiza todo el stack
# o solo un servicio:
docker service update --image $REGISTRY/foilhub-api:v1.0.1 foilhub_api
docker service rollback foilhub_api                          # volver a la versión anterior
```

Gracias a `order: start-first` y al healthcheck, cada réplica nueva tiene que estar sana antes de que se detenga una vieja. Si la nueva falla, `failure_action: rollback` revierte solo.

## 8. Guion de demo (~10 min)

Tengan abiertas: una terminal SSH en el manager, otra en `worker-2`, el navegador con la app y el visualizer.

1. **El clúster.** `docker node ls` y el visualizer: 3 nodos, qué corre en cada uno.
2. **La app.** Iniciar sesión como `ana` (datos de demo), mostrar un match, proponer desde `beto` en una ventana privada, aceptar y mostrar los contactos.
3. **Secrets.** `docker secret ls`; `docker service inspect --pretty foilhub_api` (no aparece ninguna contraseña); `docker exec <api> ls /run/secrets`.
4. **Balanceo de carga.** `for i in $(seq 1 12); do curl -s http://localhost/api/health >/dev/null; done` y después `docker service logs --since 1m foilhub_api`: las peticiones las atienden réplicas distintas (hostname en cada línea, tarea A8).
5. **Escalar.** `docker service scale foilhub_api=6` → mirar el visualizer → `docker service scale foilhub_api=3`.
6. **Autorreparación.** En `worker-2`: `docker rm -f $(docker ps -q -f name=foilhub_api | head -1)` → Swarm crea una réplica nueva en segundos (`docker service ps foilhub_api`).
7. **Rolling update sin caída.** En una terminal: `while true; do curl -s -o /dev/null -w "%{http_code} " http://<elastic-ip>/api/health; sleep 0.3; done`. En otra: `docker service update --image $REGISTRY/foilhub-api:v1.0.1 foilhub_api`. Solo aparecen `200`. Para que el cambio se vea también en el navegador, actualicen `foilhub_nginx` a una imagen cuyo footer muestre la nueva versión.
8. **Rollback.** `docker service rollback foilhub_api`.
9. **Falla de un nodo.** `docker node update --availability drain foilhub-worker-2` → sus tareas se mueven a los otros nodos. Después `--availability active`. (Swarm no rebalancea solo: `docker service update --force foilhub_api` redistribuye.)
10. **Persistencia.** `docker service update --force foilhub_db` → la base se reinicia y los datos siguen ahí, porque el volumen está en el manager y la etiqueta `db=true` la devuelve al mismo nodo.

## 9. Problemas frecuentes

| Síntoma | Causa probable | Qué revisar |
|---|---|---|
| `docker swarm join` se queda colgado | Puerto 2377 cerrado o IP equivocada | Regla del SG; usar la IP **privada** del manager |
| Los nodos se unen pero la API no llega a la BD | UDP 4789 o 7946 cerrado | Reglas UDP del SG |
| Tareas en `Pending` con "no suitable node" | Ningún nodo tiene la etiqueta `db=true` | `docker node inspect <nodo> --format '{{ .Spec.Labels }}'` |
| `No such image` / falla al descargar en los workers | Repo privado sin `--with-registry-auth` o tag que no existe | `docker login` en el manager y `deploy.sh` (ya usa la opción); verificar el tag en Docker Hub |
| La API se reinicia en bucle | Migraciones fallan, secreto no encontrado, healthcheck demasiado estricto | `docker service logs foilhub_api`; `docker service ps --no-trunc foilhub_api` |
| nginx responde 502 | Ninguna réplica de la API está sana | `docker service ps foilhub_api`; `/api/health` |
| La app no carga desde internet | Puerto 80 cerrado en el SG o Elastic IP en otra instancia | SG y asociación de la Elastic IP |

## 10. Costos y limpieza

- Las instancias cobran mientras están encendidas. Cuando no trabajen: **Stop** (no Terminate) las 3. Al encenderlas, Docker y el Swarm arrancan solos y las IPs privadas se mantienen.
- AWS cobra por hora las direcciones IPv4 públicas, incluida la Elastic IP. Es poco, pero revisen la factura.
- Al terminar el curso: Terminate de las 3 instancias, Release de la Elastic IP, borrar el Security Group y los volúmenes EBS que queden.

## 11. HTTPS (opcional)

Si consiguen un dominio: apúntenlo a la Elastic IP, agreguen la regla 443 al SG, generen el certificado con certbot (modo standalone, deteniendo nginx un momento) y móntenlo en el servicio `nginx` como `secret` de Swarm (`docker secret create tls_cert fullchain.pem`, `docker secret create tls_key privkey.pem`), con un bloque `listen 443 ssl` en `nginx.conf`.
