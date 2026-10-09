import { ClientGateway } from "./ClientGateway/ClientGateway";
import { PageGateway } from "./PageGateway/PageGateway";
import { PositionGateway } from "./PositionGateway/PositionGateway";
import { SearchUpdateGateway } from "./SearchUpdateGateway/SearchUpdateGateway";
import { SessionGateway } from "./SessionGateway/SessionGateway";

/**
 * One instance of each gateway, imported by ViewModels only (ESLint enforces it).
 *
 * Tests spy on a gateway's PROTOTYPE, so they hold whichever instance a ViewModel
 * reaches through here.
 */
export const gateways = {
	session: new SessionGateway(),
	clients: new ClientGateway(),
	pages: new PageGateway(),
	positions: new PositionGateway(),
	searchUpdates: new SearchUpdateGateway(),
};
