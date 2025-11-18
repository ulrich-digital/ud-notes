import { __ } from "@wordpress/i18n";
import { useBlockProps } from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import { InspectorControls } from "@wordpress/block-editor";

export default function Edit() {
	const blockProps = useBlockProps({
		className: "ud-blank-block",
	});

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__("Einstellungen", "ud-blank-block-ud")}
					initialOpen={true}
				>
					<p>
						{__(
							"Dies ist ein leerer Block. Hier können künftig eigene Controls hinzugefügt werden.",
							"ud-blank-block-ud"
						)}
					</p>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<p style={{ textAlign: "center", color: "#888" }}>
					{__("UD Blank Block – Platzhalter", "ud-blank-block-ud")}
				</p>
			</div>
		</>
	);
}
