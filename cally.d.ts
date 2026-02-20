/** Cally web component 타입 (unpkg/cally 스크립트 로드) */
declare namespace JSX {
  interface IntrinsicElements {
    'calendar-date': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        value?: string;
        locale?: string;
        'focused-date'?: string;
        min?: string;
        max?: string;
        onchange?: (e: Event) => void;
      },
      HTMLElement
    >;
    'calendar-month': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { offset?: number },
      HTMLElement
    >;
  }
}
