import { BadRequestException } from '@nestjs/common';
import { TemplateRenderer } from './template-renderer';

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer();
  it('renders allow-listed variables', () =>
    expect(
      renderer.render('Hello {{residentName}}', { residentName: 'Amina' }, [
        'residentName',
      ]),
    ).toBe('Hello Amina'));
  it('rejects unknown variables', () =>
    expect(() =>
      renderer.render('{{secret}}', { secret: 'x' }, ['residentName']),
    ).toThrow(BadRequestException));
  it('rejects expression syntax', () =>
    expect(() => renderer.validate('${process.env}', [])).toThrow(
      BadRequestException,
    ));
  it('requires every value', () =>
    expect(() =>
      renderer.render('{{residentName}}', {}, ['residentName']),
    ).toThrow('Missing template variable'));
  it('escapes HTML values', () =>
    expect(
      renderer.render(
        '{{residentName}}',
        { residentName: '<script>' },
        ['residentName'],
        true,
      ),
    ).toBe('&lt;script&gt;'));
  it('blocks subject header injection', () =>
    expect(() =>
      renderer.subject('{{residentName}}', { residentName: 'A\r\nBcc: x' }, [
        'residentName',
      ]),
    ).toThrow('Invalid notification subject'));
  it('extracts variables without executing them', () =>
    expect(renderer.variables('{{residentName}} {{due.amount}}')).toEqual([
      'residentName',
      'due.amount',
    ]));
});
