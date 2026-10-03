import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing from index.html");

createRoot(container).render(
	<StrictMode>
		<h1>SEO Keyword Tracker</h1>
	</StrictMode>,
);
