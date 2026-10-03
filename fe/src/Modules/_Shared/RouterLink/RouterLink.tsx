import { Anchor, Button, type AnchorProps, type ButtonProps } from "@mantine/core";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, Ref } from "react";

type TAnchorElementProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "style">;

function MantineAnchor(
	props: AnchorProps & TAnchorElementProps & { ref?: Ref<HTMLAnchorElement> },
) {
	return <Anchor {...props} />;
}

function MantineButtonAnchor(
	props: ButtonProps & TAnchorElementProps & { ref?: Ref<HTMLAnchorElement> },
) {
	return <Button component="a" {...props} />;
}

const CreatedAnchorLink = createLink(MantineAnchor);
const CreatedButtonLink = createLink(MantineButtonAnchor);

/**
 * Mantine's look with the router's typed `to`/`params`/`search`. A plain
 * `component={Link}` on a Mantine component compiles but loses that typing — a
 * misspelt route or a wrong search key would only fail at runtime.
 */
export const AnchorLink: LinkComponent<typeof MantineAnchor> = (props) => (
	<CreatedAnchorLink preload="intent" {...props} />
);

export const ButtonLink: LinkComponent<typeof MantineButtonAnchor> = (props) => (
	<CreatedButtonLink preload="intent" {...props} />
);
