# External Systems Context

## External Systems

- [System 1]: [Purpose, integration type]
- [System 2]: [Purpose, integration type]

## Design System

- Provider: [Figma / Sketch / Other]
- How we access: [Description]
- What we verify: [Visual regression, component matching]

## Calendar

- Provider: [Google / Outlook / Other]
- What we verify: [Event creation, updates, etc.]
- Test environment: [Sandbox URL]

## Email

- Provider: [Mailtrap / SendGrid / Other]
- What we verify: [Email delivery, content]
- Test environment: [Sandbox URL]

## Other External Systems

[Add other systems here]

## Environment Strategy

- Local: [Use mocks / sandbox]
- Staging: [Use sandbox accounts]
- Production: [Read-only smoke only]

## Data Cleanup Strategy

[How we clean up test data in external systems]

## Production Readonly Rules

[Explicit rules for production external system access.]

- What CAN be verified in production (readonly): [...]
- What CANNOT be verified in production (write): [...]
- Production readonly credentials: [Separate token, limited scope]
- Verification frequency: [Daily / Weekly / Per-release]
- Logging requirements: [All production access must be logged]

## Open Questions

[List questions about external systems]
