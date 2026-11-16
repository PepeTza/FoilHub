import { useMemo, useState } from 'react';
import type { CardDto, OfferDto } from '../../api/types';
import {
  CardTile,
  ColorBadge,
  OfferCard,
  RarityBadge,
  StatusBadge,
} from '../../components/trading';
import {
  Badge,
  Button,
  Combobox,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  QuantityStepper,
  Select,
  Skeleton,
  Spinner,
  Tabs,
  TextField,
  useToast,
} from '../../components/ui';

const SAMPLE_CARDS: CardDto[] = [
  {
    code: 'BT1-084',
    name: 'Omnimon',
    setName: 'Release Special Booster Ver.1.0 [BT01-03]',
    rarity: 'SR',
    color: 'White',
    cardType: 'Digimon',
    imageUrl: 'https://images.digimoncard.io/images/cards/BT1-084.jpg',
  },
  {
    code: 'ST1-03',
    name: 'Agumon',
    setName: 'Starter Deck Gaia Red [ST-01]',
    rarity: 'U',
    color: 'Red',
    cardType: 'Digimon',
    imageUrl: 'https://images.digimoncard.io/images/cards/ST1-03.jpg',
  },
  {
    code: 'ST2-11',
    name: 'MetalGarurumon',
    setName: 'Starter Deck Cocytus Blue [ST-02]',
    rarity: 'SR',
    color: 'Blue',
    cardType: 'Digimon',
    imageUrl: 'https://images.digimoncard.io/images/cards/ST2-11.jpg',
  },
  {
    code: 'BT2-111',
    name: 'Beelzemon',
    setName: 'Release Special Booster Ver.1.5 [BT01-03]',
    rarity: 'SEC',
    color: 'Purple',
    cardType: 'Digimon',
    imageUrl: null,
  },
];

const SAMPLE_OFFER: OfferDto = {
  id: 'offer-demo-1',
  owner: { id: 'user-1', username: 'ana' },
  offered: { card: SAMPLE_CARDS[0], quantity: 1 },
  wanted: { card: SAMPLE_CARDS[2], quantity: 2 },
  status: 'OPEN',
  createdAt: '2026-11-16T15:00:00.000Z',
  closedAt: null,
};

const MATCH_OFFER: OfferDto = {
  id: 'offer-demo-2',
  owner: { id: 'user-2', username: 'beto' },
  offered: { card: SAMPLE_CARDS[1], quantity: 4 },
  wanted: { card: SAMPLE_CARDS[3], quantity: 1 },
  status: 'COMPLETED',
  createdAt: '2026-11-15T12:00:00.000Z',
  closedAt: '2026-11-16T14:00:00.000Z',
};

export function UiCatalogPage() {
  const { showToast } = useToast();
  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState('OPEN');
  const [quantity, setQuantity] = useState(2);
  const [comboQuery, setComboQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardDto | null>(SAMPLE_CARDS[0]);
  const [activeTab, setActiveTab] = useState('recibidas');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredCards = useMemo(() => {
    const q = comboQuery.trim().toLowerCase();
    if (!q) {
      return SAMPLE_CARDS;
    }
    return SAMPLE_CARDS.filter(
      (card) =>
        card.name.toLowerCase().includes(q) || card.code.toLowerCase().includes(q),
    );
  }, [comboQuery]);

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-border-subtle pb-4">
        <Badge variant="foil">Solo desarrollo · /_ui</Badge>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
          Catálogo del sistema visual
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tokens del tema oscuro holográfico, componentes genéricos en{' '}
          <code className="text-foil-cyan">components/ui/</code> y piezas de trading en{' '}
          <code className="text-foil-cyan">components/trading/</code>.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h2 className="font-display text-lg font-bold text-text-primary">Botones y carga</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primario foil</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="primary" loading>
            Cargando
          </Button>
          <Button variant="secondary" disabled>
            Deshabilitado
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="sm" variant="secondary">
            Pequeño
          </Button>
          <Button size="md" variant="secondary">
            Mediano
          </Button>
          <Button size="lg" variant="secondary">
            Grande
          </Button>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-display text-lg font-bold text-text-primary">Formularios</h2>
        </div>

        <TextField
          label="Texto normal"
          placeholder="Escribe aquí..."
          helperText="Texto de ayuda descriptivo."
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
        />

        <TextField
          label="Campo con error"
          defaultValue="ab"
          error="El usuario debe tener entre 3 y 20 caracteres."
        />

        <Select
          label="Estado de oferta"
          value={selectValue}
          onChange={(event) => setSelectValue(event.target.value)}
          options={[
            { value: 'OPEN', label: 'Abierta' },
            { value: 'COMPLETED', label: 'Completada' },
            { value: 'CANCELLED', label: 'Cancelada' },
          ]}
        />

        <QuantityStepper
          label="Cantidad de copias"
          value={quantity}
          onChange={setQuantity}
        />

        <div className="md:col-span-2">
          <Combobox
            label="Buscador de cartas (Combobox)"
            query={comboQuery}
            onQueryChange={setComboQuery}
            options={filteredCards}
            getOptionKey={(card) => card.code}
            getOptionLabel={(card) => `${card.code} — ${card.name}`}
            placeholder="Busca por nombre o código (ej. Agumon, BT1-084)"
            helperText={
              selectedCard
                ? `Seleccionada: ${selectedCard.code} — ${selectedCard.name}`
                : undefined
            }
            onSelect={(card) => {
              setSelectedCard(card);
              setComboQuery(`${card.code} — ${card.name}`);
            }}
            renderOption={(card) => (
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text-primary">
                  <span className="font-display text-foil-cyan">{card.code}</span> ·{' '}
                  {card.name}
                </span>
                <RarityBadge rarity={card.rarity} />
              </div>
            )}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h2 className="font-display text-lg font-bold text-text-primary">
          Badges, estados y colores Digimon
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Éxito</Badge>
          <Badge variant="warning">Aviso</Badge>
          <Badge variant="danger">Error</Badge>
          <Badge variant="foil">Match exacto</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="OPEN" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="COMPLETED" />
          <StatusBadge status="ACCEPTED" />
          <StatusBadge status="REJECTED" />
          <StatusBadge status="CANCELLED" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ColorBadge color="Red" />
          <ColorBadge color="Blue" />
          <ColorBadge color="Yellow" />
          <ColorBadge color="Green" />
          <ColorBadge color="Black" />
          <ColorBadge color="Purple" />
          <ColorBadge color="White" />
        </div>
        <div className="flex flex-wrap gap-2">
          <RarityBadge rarity="C" />
          <RarityBadge rarity="U" />
          <RarityBadge rarity="R" />
          <RarityBadge rarity="SR" />
          <RarityBadge rarity="SEC" />
          <RarityBadge rarity="P" />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h2 className="font-display text-lg font-bold text-text-primary">
          Cartas (CardTile)
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CardTile card={SAMPLE_CARDS[0]} quantity={1} highlighted />
          <CardTile card={SAMPLE_CARDS[1]} quantity={4} />
          <CardTile card={SAMPLE_CARDS[2]} quantity={2} />
          <CardTile card={SAMPLE_CARDS[3]} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h2 className="font-display text-lg font-bold text-text-primary">
          Ofertas (OfferCard)
        </h2>
        <OfferCard
          offer={SAMPLE_OFFER}
          highlighted
          footer="Match disponible con tu oferta de MetalGarurumon"
          actions={
            <>
              <Button size="sm" variant="primary">
                Proponer trade
              </Button>
              <Button size="sm" variant="secondary">
                Ver detalle
              </Button>
            </>
          }
        />
        <OfferCard
          offer={MATCH_OFFER}
          actions={
            <Button size="sm" variant="danger">
              Cancelar
            </Button>
          }
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h2 className="font-display text-lg font-bold text-text-primary">
          Pestañas, paginación, modal y toasts
        </h2>
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: 'recibidas',
              label: 'Recibidas',
              badge: <Badge variant="info">2</Badge>,
              content: (
                <p className="text-sm text-text-secondary">
                  Contenido de propuestas recibidas (navega con flechas izquierda/derecha).
                </p>
              ),
            },
            {
              id: 'enviadas',
              label: 'Enviadas',
              badge: <Badge variant="neutral">1</Badge>,
              content: (
                <p className="text-sm text-text-secondary">
                  Contenido de propuestas enviadas.
                </p>
              ),
            },
          ]}
        />

        <Pagination page={page} pageSize={10} total={34} onPageChange={setPage} />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                variant: 'success',
                title: 'Propuesta aceptada',
                description: 'Ya puedes ver el contacto de la otra persona.',
              })
            }
          >
            Toast éxito
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                variant: 'error',
                title: 'No se pudo completar',
                description: 'La oferta ya no está abierta.',
              })
            }
          >
            Toast error
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                variant: 'warning',
                title: 'Atención',
                description: 'Queda poco tiempo para confirmar.',
              })
            }
          >
            Toast aviso
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirmar cancelación"
          description="Al cancelar la oferta se rechazarán automáticamente sus propuestas pendientes."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalOpen(false);
                  showToast({
                    variant: 'info',
                    title: 'Acción confirmada desde el modal',
                  });
                }}
              >
                Cancelar oferta
              </Button>
            </>
          }
        >
          <p>Esta acción no se puede deshacer.</p>
        </Modal>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface-1 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Estados de carga, vacío y error
          </h2>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-2 p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <ErrorState
          message="No se pudo conectar con el servidor. Intenta de nuevo."
          onRetry={() =>
            showToast({ variant: 'info', title: 'Reintentando petición...' })
          }
        />

        <div className="md:col-span-2">
          <EmptyState
            title="Sin ofertas todavía"
            description="Publica tu primera oferta para empezar a intercambiar cartas."
            action={<Button size="sm">Crear oferta</Button>}
          />
        </div>
      </section>
    </div>
  );
}
