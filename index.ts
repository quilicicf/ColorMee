const RESET_CODE = '\x1b[0m';

export enum ForegroundCode {
  Black = 30,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
  Magenta = 35,
  Cyan = 36,
  White = 37,
  Default = 39,
  Bright_Black = 90,
  Bright_Red = 91,
  Bright_Green = 92,
  Bright_Yellow = 93,
  Bright_Blue = 94,
  Bright_Magenta = 95,
  Bright_Cyan = 96,
  Bright_White = 97,
}

export enum BackgroundCode {
  Black = 40,
  Red = 41,
  Green = 42,
  Yellow = 43,
  Blue = 44,
  Magenta = 45,
  Cyan = 46,
  White = 47,
  Default = 49,
  Bright_Black = 100,
  Bright_Red = 101,
  Bright_Green = 102,
  Bright_Yellow = 103,
  Bright_Blue = 104,
  Bright_Magenta = 105,
  Bright_Cyan = 106,
  Bright_White = 107,
}

export enum StyleCode {
  Reset = 0,
  Bold = 1,
  Dim = 2,
  Italic = 3,
  Underline = 4,
  Blink_Slow = 5,
  Blink_Fast = 6,
  Reverse_Video = 7,
  Conceal = 8,
  Crossed_Out = 9,
  Primary = 10,
  Alternative_Font_1 = 11,
  Alternative_Font_2 = 12,
  Alternative_Font_3 = 13,
  Alternative_Font_4 = 14,
  Alternative_Font_5 = 15,
  Alternative_Font_6 = 16,
  Alternative_Font_7 = 17,
  Alternative_Font_8 = 18,
  Alternative_Font_9 = 19,
  Fraktur = 20,
  Double_Underline = 21,
  Normal = 22,
  Italic_And_Fraktur_Off = 23,
  Underline_Off = 24,
  Blink_Off = 25,
  Proportional_Spacing = 26,
  Reverse_And_Invert_Off = 27,
  Reveal_And_Conceal_Off = 28,
  Crossed_Off = 29
}

function checkRgbRange (code: number) {
  if (code < 0 || code > 255) {
    throw Error(`RGB codes should be between 0 & 255, got: ${code}`);
  }
  return code;
}

class RgbCode {
  red: number;
  green: number;
  blue: number;

  constructor (red: number, green: number, blue: number) {
    this.red = checkRgbRange(red);
    this.green = checkRgbRange(green);
    this.blue = checkRgbRange(blue);
  }
}

export class ForegroundRgbCode extends RgbCode {
  toString () {
    return `38;2;${this.red};${this.green};${this.blue}`;
  }
}

export class BackgroundRgbCode extends RgbCode {
  toString () {
    return `48;2;${this.red};${this.green};${this.blue}`;
  }
}

export interface Style {
  foreground?: ForegroundCode | ForegroundRgbCode,
  background?: BackgroundCode | BackgroundRgbCode,
  style?: StyleCode,
}

export enum ColorMode { COLOR, NO_COLOR}

export class Styler {
  colorCode: string;

  constructor (style: Style) {
    this.colorCode = Styler.createCode(style);
  }

  private static createCode (fullStyle: Style) {
    const { foreground, background, style } = fullStyle;
    const codes = [ foreground, background, style ].filter(code => !!code);
    return `\x1b[${codes.join(';')}m`;
  }

  color (string: string, colorMode: ColorMode) {
    return colorMode === ColorMode.NO_COLOR ? string : `${this.colorCode}${string}`;
  }

  colorOnce (string: string, colorMode: ColorMode = ColorMode.COLOR) {
    return colorMode === ColorMode.NO_COLOR
      ? string
      : `${this.colorCode}${string}${RESET_CODE}`;
  }
}

export interface ColorCommand {
  string: string,
  style?: Style | Styler
}

function isStyler (object: any): object is Styler {
  return object.color !== undefined;
}

export function compose (fullStyle: Style): Styler {
  return new Styler(fullStyle);
}

export function wrap (fragments: ColorCommand[], colorMode: ColorMode = ColorMode.COLOR) {
  if (fragments.length === 0) { return ''; }

  const isColorMode = colorMode === ColorMode.COLOR;
  const { result, isDefaultStyle } = fragments
    .reduce((seed, { string, style }: ColorCommand): { isDefaultStyle: boolean, result: string } => {
        if (!style) {
          return isColorMode && !seed.isDefaultStyle
            ? { isDefaultStyle: true, result: seed.result + `${RESET_CODE}${string}` }
            : { ...seed, result: seed.result + string };
        }

        const styler: Styler = isStyler(style) ? style : new Styler(style);
        return {
          isDefaultStyle: styler.colorCode === RESET_CODE,
          result: seed.result + styler.color.bind(styler)(string, colorMode)
        };
      },
      {
        isDefaultStyle: true,
        result: ''
      }
    );

  return result + (isColorMode && !isDefaultStyle ? RESET_CODE : '');
}
