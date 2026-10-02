export type CustomDropdownPayload = Readonly<{
  module: string;
}>;

type DropdownModule = { module_name: string; for?: string };

export class CustomDropdownPayloadBuilder {
  private readonly modules: DropdownModule[] = [];

  withModule(moduleName: string, purpose?: string): this {
    this.modules.push(purpose ? { module_name: moduleName, for: purpose } : { module_name: moduleName });
    return this;
  }

  build(): CustomDropdownPayload {
    if (this.modules.length === 0) {
      throw new Error('CustomDropdownPayloadBuilder: at least one module is required - use withModule()');
    }
    return Object.freeze({ module: JSON.stringify(this.modules) });
  }
}
