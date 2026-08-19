export type ReportType = {
  code: string; name_en: string; name_hi: string;
  chapters: number; credits: number; ready: boolean;
};
export type Design = {
  id: string; name: { en: string; hi: string }; tagline: { en: string; hi: string };
  traits: { chapterOpen: string; columns: number; ornament: boolean; density: string };
};
export type Palette = { id: string; name: { en: string; hi: string }; swatch: string[] };
export type Preview = {
  type: string; design: string; palette: string; lang: string;
  total_pages: number; pdf: string; images: { page: number; url: string }[];
};
export type Branding = {
  honorific?: string; display_name?: string; shop_name?: string; phone?: string;
  whatsapp?: string; address?: string; logo_url?: string; photo_url?: string;
  tagline?: string; default_design?: string; default_palette?: string;
  default_language?: string; ui_language?: string;
};
export type Report = {
  id: string; report_type: string; design: string; palette: string; language: string;
  status: string; pdf_url: string; page_count: number; credits_charged: number;
  generated_ms: number; createdAt: string; Client?: { name: string; phone?: string };
};
export type Earnings = {
  estimated: boolean; earned_paise: number; spent_paise: number; multiple: number | null;
  reports: number; credits_used: number;
  by_type: { report_type: string; name_hi: string; name_en: string; count: number;
             price_paise: number; earned_paise: number }[];
};
