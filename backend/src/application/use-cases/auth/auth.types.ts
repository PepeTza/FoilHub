export interface UserSummary {
  id: string;
  username: string;
}

export interface CurrentUser extends UserSummary {
  contactInfo: string | null;
}
