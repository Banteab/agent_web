export const API_ORIGIN = "https://biftubus-api.liyubus.com";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api-proxy";

export const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "zR0ClHzLGi";

export const ENDPOINTS = {
  login: "/agent/auth/login",
  profile: "/agent/profile",
  updateProfile: "/agent/update-profile",
  salesReport: (start: string, end: string) =>
    `/agent/self-sales-report/${start}/${end}`,
  cities: "/cities",
  cityNames: "/city/name",
  searchTrip: "/trips/search/agent",
  searchTripByDate: (date: string) => `/trips/search/date/${date}/agent`,
  tripById: (id: number | string) => `/trips/${id}`,
  formattedSeats: (id: number | string) => `/trips/formatted-seats/${id}`,
  firstSeat: "/booking/agent",
  topUp: "/top-up-request",
  updateSeat: (bookingId: number | string, seat: number | string) =>
    `/booking/update-seat/${bookingId}/seat/${seat}`,
  removeSeat: (seat: number | string, bookingId: number | string) =>
    `/booking/remove-seat/${seat}/booking/${bookingId}`,
  passengerData: (bookingId: number | string) =>
    `/booking/passgenger-data/${bookingId}`,
  booking: (id: number | string) => `/booking/${id}`,
  updateBookingStatus: (id: number | string) => `/booking/update-status/${id}`,
  paymentData: (bookingId: number | string) =>
    `/booking/payment-data/${bookingId}`,
  confirmBankPayment: (bookingId: number | string) =>
    `/booking/agent/${bookingId}/confirm-bank-payment`,
  refundRequest: "/refunds/request-cancellation",
  generateTickets: "/tickets/generate/agent",
  issueTicket: "/tickets/issue/agent",
  ticketByNumber: (ticketNumber: string) =>
    `/tickets/ticket-number/${ticketNumber}`,
  cancelTicket: "/refunds/request-cancellation/agent",
  activateTicket: (ticketId: number | string) =>
    `/tickets/activate-ticket/${ticketId}`,
  bookedTickets: "/tickets/agent/booked",
  cancelledTickets: "/tickets/agent/cancelled",
  updateTicket: (id: number | string) => `/tickets/${id}`,
  ticketReport: (type: string) => `/report/ticket/${type}`,
  ofechoReport: "/report/ticket/ofecho",
  cancellationPolicy: "/cancellation-policy/agent",
  associationLogo: (imageUrl: string) => `/bus-association/logo/${imageUrl}`,
} as const;

export const BRAND_LOGO = "/images/biftu-bus.png";
export const BRAND_NAME = "Biftu Bus";

export const logoUrl = (imageUrl?: string | null) =>
  imageUrl ? `${API_BASE_URL}/bus-association/logo/${imageUrl}` : BRAND_LOGO;

export const STORAGE_KEYS = {
  token: "token_key",
  imageUrl: "image_url",
  themeColor: "theme_color",
  busAssociationName: "bus_association_name",
  locale: "locale",
  recentHistories: "recentHistories",
  searchedBus: "searchedBus",
  bookingSession: "bookingSession",
  pendingBankPayments: "pendingBankPayments",
} as const;

export const BOOKING_HOLD_MS = 180_000;
export const MAX_SEATS = 6;

export const LOCALES = [
  { id: "en-US", label: "English (US)", flag: "🇺🇸" },
  { id: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { id: "am-ET", label: "አማርኛ", flag: "🇪🇹" },
  { id: "om-ET", label: "Afaan Oromoo", flag: "🇪🇹" },
  { id: "ti-ET", label: "ትግርኛ", flag: "🇪🇹" },
] as const;

export const DEFAULT_LOCALE = "am-ET";

export const BANKS = [
  { id: "CBE", name: "Commercial Bank of Ethiopia", logo: "/images/cbe.jpg" },
  { id: "AWASH", name: "Awash Bank", logo: "/images/awash.png" },
  { id: "DASHEN", name: "Dashen Bank", logo: "/images/dashen.png" },
  { id: "COOP", name: "Cooperative Bank", logo: "/images/coop.png" },
] as const;

// Banks offered at booking checkout for the BANK payment method. A small,
// explicit subset of BANKS — CASH and REFERENCE are hidden there for now.
export const CHECKOUT_BANKS = [BANKS[1], BANKS[0]];
