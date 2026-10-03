import { HealthGateway } from "./HealthGateway/HealthGateway";
import { SessionGateway } from "./SessionGateway/SessionGateway";

/**
 * One instance of each gateway, imported by ViewModels only (ESLint enforces it).
 *
 * Tests spy on a gateway's PROTOTYPE, so they hold whichever instance a ViewModel
 * reaches through here.
 */
export const gateways = {
	health: new HealthGateway(),
	session: new SessionGateway(),
};
