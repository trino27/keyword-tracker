import { HealthGateway } from "./HealthGateway/HealthGateway";

/**
 * One instance of each gateway, imported by ViewModels only (ESLint enforces it).
 *
 * Tests spy on a gateway's PROTOTYPE, so they hold whichever instance a ViewModel
 * reaches through here.
 */
export const gateways = {
	health: new HealthGateway(),
};
