import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.scss";

import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "@App/Router/router";
import { theme } from "@Core/Configs/theme";

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing from index.html");

createRoot(container).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="light">
			<RouterProvider router={router} />
		</MantineProvider>
	</StrictMode>,
);
