import { BadRequestException, Injectable } from '@nestjs/common';

const TOKEN = /{{\s*([A-Za-z][A-Za-z0-9_.]*)\s*}}/g;
export type TemplateValues = Record<string, string | number>;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

@Injectable()
export class TemplateRenderer {
  variables(source: string): string[] {
    return [...source.matchAll(TOKEN)].map((match) => match[1]);
  }
  validate(source: string, allowed: readonly string[]): void {
    if (
      source.includes('${') ||
      source.includes('<%') ||
      source.includes('{{{')
    )
      throw new BadRequestException('Template expressions are not permitted.');
    const invalid = this.variables(source).find(
      (name) => !allowed.includes(name),
    );
    if (invalid)
      throw new BadRequestException(`Unknown template variable: ${invalid}`);
  }
  render(
    source: string,
    values: TemplateValues,
    allowed: readonly string[],
    html = false,
  ): string {
    this.validate(source, allowed);
    return source.replace(TOKEN, (_whole, name: string) => {
      if (!(name in values))
        throw new BadRequestException(`Missing template variable: ${name}`);
      const value = String(values[name]);
      return html ? escapeHtml(value) : value;
    });
  }
  subject(
    source: string,
    values: TemplateValues,
    allowed: readonly string[],
  ): string {
    const rendered = this.render(source, values, allowed);
    if (/\r|\n/.test(rendered))
      throw new BadRequestException('Invalid notification subject.');
    return rendered;
  }
}
