/** The signed-in user as the API describes them: `POST /auth/login` and `GET /auth/me`. */
export interface ISessionUser {
  id: number;
  email: string;
  /** IANA zone; every calendar day on screen and in a date-range query is in this zone. */
  timeZone: string;
}
