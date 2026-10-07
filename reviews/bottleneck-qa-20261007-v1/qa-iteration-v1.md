# Bottleneck Finder design QA — iteration 1

Source visual truth: docs/concepts/quick-roi-20261007-v1/bottleneck-finder.png (1487×1058).
Implementation: desktop-result-unscrolled-v1.jpg (1487×1058), CSS viewport 1487×1058, density 1, scroll 0; Batch review, example result, assumptions collapsed. The two images were opened together in one comparison input.

- P1: Custom blue and surface tokens did not resolve. Selected lane, key values and outline action lacked the source hierarchy. Map shared tokens inside the isolated app.
- P2: The page inset was 112px rather than the source 64px, making the opportunity region too narrow and the main figures too small. Increase container width and match column proportions and result type.
- Intentional: Shared original calculator background and system font remain for continuity. Explicit units, helper text and evidence caveats expand the mock's content. Standard circular choice icons replace the initial decorative lane icons to match the selection treatment.

final result: blocked
