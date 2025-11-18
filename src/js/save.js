import { useBlockProps } from "@wordpress/block-editor";

/**
 * save.js
 *
 * Frontend-Markup für den UD Blank Block.
 * Gibt statisches Markup aus, wenn kein serverseitiges Rendern benötigt wird.
 */

export default function save() {
	const blockProps = useBlockProps.save({
		className: "ud-blank-block",
	});

	return (
		<div {...blockProps}>
			<p className="ud-blank-placeholder">
				UD Blank Block – statischer Platzhalter
			</p>
		</div>
	);
}
