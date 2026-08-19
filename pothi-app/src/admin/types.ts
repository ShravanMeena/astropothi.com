// Shapes the admin API actually returns. Written from the service, not guessed —
// if a field is optional here it is because the server can genuinely omit it.

export type Window = "today" | "7d" | "30d" | "all";

export type StatusCount = { count: number; gross_paise: number };

export type Funnel = {
  by_status: Record<string, StatusCount>;
  orders_created: number;
  orders_paid: number;
  abandoned: number;
  abandoned_paise: number;
  failed: number;
  failed_paise: number;
  conversion_pct: number | null;
};

export type ConsumerRevenue = {
  orders: number; gross_paise: number; gst_paise: number; net_paise: number;
  refunded_orders: number; refunded_paise: number; net_of_refunds_paise: number;
  aov_paise: number;
};

export type PanditRevenue = {
  purchases: number; gross_paise: number; gst_paise: number; net_paise: number;
  credits_sold: number; aov_paise: number;
};

export type TypeRow = {
  report_type: string; name_en: string; name_hi: string;
  list_price_paise: number | null; orders: number; gross_paise: number; net_paise: number;
};

export type DayRow = {
  day: string; orders_created: number; orders_paid: number;
  consumer_gross_paise: number; pandit_gross_paise: number;
};

export type Overview = {
  window: Window;
  generated_at: string;
  funnel: Funnel;
  // Two keys, never three. There is deliberately no combined total.
  revenue: { consumer: ConsumerRevenue; pandit: PanditRevenue };
  by_type: TypeRow[];
  by_day: DayRow[];
  reports: {
    total: number; ready: number; failed: number; generating: number;
    avg_ms: number; max_ms: number;
    by_source: { source: string; count: number }[];
  };
  audience: {
    // Totals are all-time on purpose; only joined_in_window respects the window.
    users: { total: number; verified: number; suspended: number; joined_in_window: number };
    pandits: { total: number; seated: number; suspended: number; admins: number; joined_in_window: number };
  };
};

export type OrderRow = {
  public_id: string; status: string; paid: boolean;
  report_type: string; report_name: string;
  design: string; palette: string; language: string;
  amount_paise: number; gst_paise: number;
  buyer_name: string | null; buyer_phone: string | null; buyer_email: string | null;
  state: string | null; subject_name: string | null;
  user_id: string | null; report_id: string | null;
  invoice_no: string | null;
  razorpay_link_id: string | null; razorpay_link_url: string | null; razorpay_payment_id: string | null;
  error: string | null;
  created_at: string; updated_at: string;
};

export type OrderDetail = OrderRow & {
  birth: Record<string, unknown> | null;
  report: {
    id: string; status: string; pdf_url: string | null; page_count: number | null;
    generated_ms: number | null; rashi: string | null; nakshatra: string | null; lagna: string | null;
  } | null;
  orphan_reports: { id: string; status: string; pdf_url: string | null; page_count: number | null; created_at: string }[];
  user: { id: string; phone: string; name: string | null; status: string } | null;
};

export type UserRow = {
  id: string; phone: string; name: string; email: string;
  status: string; verified: boolean;
  orders: number; paid_orders: number; ltv_paise: number;
  last_seen_at: string | null; created_at: string;
};

export type UserProfile = {
  ishta_devta?: string; tradition?: string; gotra?: string; city?: string;
  languages?: string[]; interests?: string[]; practices?: string[];
  looking_for?: string; notes?: string;
};

export type UserDetail = {
  id: string; phone: string; isd_code: string; name: string; email: string;
  status: string; verified: boolean; verified_at: string | null;
  birth: Record<string, unknown> | null;
  profile: UserProfile;
  last_seen_at: string | null; created_at: string;
  ltv_paise: number;
  orders: OrderRow[];
  unclaimed_orders: OrderRow[];
};

export type ReportRow = {
  id: string; source: string; status: string;
  report_type: string; report_name: string;
  design: string; palette: string; language: string;
  page_count: number | null; generated_ms: number | null; credits_charged: number;
  pdf_url: string | null;
  rashi: string | null; nakshatra: string | null; lagna: string | null;
  subject_name: string | null; error: string | null; created_at: string;
  owner: { kind: string; id: string; label: string } | null;
};

export type PanditRow = {
  id: string; phone: string; name: string; email: string;
  city: string; state: string; business_name: string; gstin: string;
  status: string; pilot_seat: number | null; invite_code: string | null; is_admin: boolean;
  balance: number; reports_ready: number; spent_paise: number;
  trial_granted_at: string | null; last_seen_at: string | null; created_at: string;
};

export type PanditDetail = PanditRow & {
  branding: Record<string, string | number | null> | null;
  ledger: { id: string; delta: number; reason: string; ref_type: string | null; ref_id: string | null; note: string | null; created_at: string }[];
  purchases: { id: string; status: string; amount_paise: number; gst_paise: number; credits: number; invoice_no: string | null; razorpay_order_id: string | null; razorpay_payment_id: string | null; expires_at: string | null; created_at: string }[];
  prices: { report_type: string; name_en: string; sale_price_paise: number | null }[];
  reports: { id: string; status: string; report_type: string; report_name: string; design: string; palette: string; language: string; page_count: number | null; generated_ms: number | null; credits_charged: number; pdf_url: string | null; subject_name: string | null; created_at: string }[];
};

export type PaymentLink = {
  public_id: string; link_id: string; link_url: string | null; payment_id: string | null;
  status: string; settled: boolean; amount_paise: number; buyer_phone: string | null;
  created_at: string; updated_at: string;
};

export type Catalogue = {
  source: string;
  gst_rate_pct: number;
  reports: { code: string; name_en: string; name_hi: string; chapters: number; credits: number; ready: boolean; consumer_price_paise: number | null; pilot_credits: number }[];
  packs: { code: string; name_en: string; name_hi: string; price_paise: number; credits: number; validity_days: number }[];
  pilot: { on: boolean; seats: number; seats_taken: number; seats_left: number; free_reports: number };
};

export type Environment = {
  env: string;
  pilot: { on: boolean; seats: number; reports: number; inviteCode: string };
  otp_bypass_enabled: boolean;
  auto_login_on_order: boolean;
  razorpay_configured: boolean;
  webhook_secret_configured: boolean;
  consumer_brand: string;
  web_origin: string;
};

export type Me = { id: string; phone: string; name: string; environment: Environment };
