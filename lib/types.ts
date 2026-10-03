export type PaymentTransactionChildItem = {
  id: string;
  transactionNumber: string;
  credit?: string | null;
  status?: string | null;
  cancelledAt?: string | null;
  ticketId?: number | null;
  ticketNo?: string | null;
};

export type PaymentTransactionListItem = {
  id: string;
  transactionNumber: string;
  transactionAt?: string | null;
  postDate?: string | null;
  transactionType?: string | null;
  description?: string | null;
  debit?: string | null;
  credit?: string | null;
  amount?: string | null;
  status?: string | null;
  ticketId?: number | null;
  ticketNo?: string | null;
  createdAt?: string | null;
};

export type PaymentTransactionDetail = PaymentTransactionListItem & {
  accountReference?: string | null;
  bank?: string | null;
  currency?: string | null;
  payerName?: string | null;
  payerPhone?: string | null;
  pnr?: string | null;
  bookingId?: number | null;
  ticket?: { id?: number; ticketNo?: string } | null;
  parentId?: string | null;
  parent?: { id: string; transactionNumber?: string } | null;
  children?: PaymentTransactionChildItem[] | null;
  booking?: { id?: number; refNumber?: string } | null;
  usedAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string | null;
  remarks?: string | null;
  used?: boolean;
  usedBy?: { id: number; firstName?: string; lastName?: string; phoneNo?: string } | null;
  uploadedBy?: { id: number; firstName?: string; lastName?: string; email?: string } | null;
  /** Present only for Director/Finance bus-admin; agents never receive this. */
  balance?: string | null;
};

export type PaymentTransactionLookup = {
  credit?: string | null;
  transactionNumber: string;
  status?: string | null;
  transactionAt?: string | null;
  transactionType?: string | null;
  description?: string | null;
  payerName?: string | null;
  payerPhone?: string | null;
  pnr?: string | null;
  bookingId?: number | null;
  postDate?: string | null;
  usedBy?: { id: number; firstName: string; lastName: string } | null;
  usedAt?: string | null;
};

export type ApiMessage<T = unknown> = {
  success?: boolean;
  status?: number;
  message?: string;
  data?: T;
};

export type GenerateTicketsResponse = ApiMessage<string[]>;

export type IssuedTicket = {
  id?: number;
  ticketNo?: string;
  passenger?: string;
  seat?: string;
  phoneNumber?: string;
};

export type LoginData = {
  access_token: string;
  image_url?: string;
  theme_color?: string;
  bus_association_name?: string;
};

export type LoginResponse = ApiMessage & {
  data?: LoginData;
};

export type Profile = {
  id?: number;
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  balance?: number;
  commision?: number;
  type?: string;
  status?: string;
  booked?: number;
  cancelled?: number;
  total?: number;
  totalMade?: number;
};

export type CancellationPolicy = {
  name?: string;
  value?: string;
  charge?: string;
  status?: string;
};

export type RouteObject = {
  id?: number;
  from?: string;
  to?: string;
  price?: number;
  departureTime?: string;
  arrivalTime?: string;
};

export type SearchResult = {
  id: number;
  busId?: number;
  blockedSeats?: unknown[];
  bookedSeats?: unknown[];
  selectedSeats?: unknown[];
  busAssociation?: string;
  pinSideNumber?: string;
  sideNumber?: string;
  distance?: number;
  busStructure?: string;
  busStructureName?: string;
  seatsLeft?: number;
  amenities?: unknown;
  terms?: unknown;
  cancellationPolicy?: CancellationPolicy[];
  pickup?: string;
  dropoff?: string;
  from?: string;
  to?: string;
  price?: number;
  departureTime?: string;
  arrivalTime?: string;
  selectedRoute?: string | RouteObject;
  travelDate?: string;
  isSubRoute?: boolean;
  status?: string;
  route?: RouteObject;
  routeObject?: RouteObject;
  mainRoute?: RouteObject;
  plateNumber?: string;
};

export type Place = {
  id?: number;
  name?: string;
  status?: string;
};

export type TripDetail = {
  id: number;
  from?: string;
  to?: string;
  price?: number;
  fromSubRoutes?: string;
  toSubRoutes?: string;
  travelDate?: string;
  blockedSeats?: string;
  status?: string;
  bus?: {
    id?: number;
    sideNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
    status?: string;
    busAssociation?: { name?: string };
    busStructure?: { name?: string; seater?: number; structure?: string };
  };
  route?: {
    id?: number;
    price?: number;
    pickup?: Place[];
    dropoff?: Place[];
    from?: Place;
    to?: Place;
  };
  booking?: unknown[];
};

export type Booking = {
  id: number;
  refNumber?: string;
  phoneNumber?: string;
  passengers?: string;
  seat?: string;
  status?: string;
  pickup?: string;
  dropoff?: string;
  price?: number;
  firstSeatReserved?: string;
  selectedRoute?: string;
  selectedRouteParsed?: RouteObject;
  parseSelectedRoute?: RouteObject;
  paymentMethod?: string;
  bankReferenceNumber?: string;
  bank?: string;
  bookedByAgent?: boolean;
  bus?: {
    id?: number;
    sideNumber?: string;
    plateNumber?: string;
    status?: string;
    busAssociation?: { name?: string; tinNumber?: string };
  };
  agent?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    phoneNo?: string;
    commision?: number;
  };
  trip?: {
    id?: number;
    from?: string;
    to?: string;
    price?: number;
    travelDate?: string;
  };
  tickets?: unknown[];
  // Proposed for the booking-search endpoint — lets the search result link
  // straight to /cancel/summary for a booking the searching agent owns.
  ticketNumbers?: string[];
};

export type Ticket = {
  id: number;
  ticketNo?: string;
  bank?: string;
  printed?: boolean;
  serialNo?: number;
  passenger?: string;
  seat?: string;
  status?: string;
  date?: string;
  createdAt?: string;
  signedQR?: string;
  irn?: string;
  booking?: Booking;
  invoiceDocument?: {
    SellerDetails?: { Tin?: string };
  };
};

export type TicketListItem = Ticket;

// A per-ticket row inside a route's breakdown. Field names are read
// defensively (see reportPassengerFields in lib/utils.ts) since different
// report endpoints on the API label the same data slightly differently.
export type ReportPassenger = {
  passenger?: string;
  name?: string;
  seat?: string;
  ticketNo?: string;
  ticket_no?: string;
  price?: string | number;
  amount?: string | number;
  phoneNumber?: string;
  phone?: string;
  paymentMethod?: string;
  bank?: string;
  bankReferenceNumber?: string;
  transactionNumber?: string;
  reference?: string;
  refNumber?: string;
  referenceNumber?: string;
};

export type RouteSales = {
  from?: string;
  to?: string;
  totalTickets?: number;
  ticketSales?: number;
  passengers?: ReportPassenger[];
  tickets?: ReportPassenger[];
};

export type RouteSalesData = {
  date?: string;
  routeSales?: RouteSales[];
};

export type OfechoRow = {
  from?: string;
  to?: string;
  name?: string;
  seat?: string;
  price?: number;
  bus?: string;
};

export type TicketReport = {
  ticket?: Ticket[];
  route?: {
    route?: string;
    passengers?: ReportPassenger[];
  }[];
};

export type BookingSession = {
  fromCity: string;
  toCity: string;
  visualDate?: string;
  isoDate?: string;
  trip?: SearchResult;
  tripDetail?: TripDetail;
  selectedSeats: number[];
  bookingId?: number;
  endTime?: number;
  pickup?: string;
  dropoff?: string;
  phoneNumber?: string;
  passengers?: string;
  ticketNumbers?: string[];
};

// Summary handed off from the payment/review step to the booking-complete
// screen (app/book/complete). "bank_pending" is the live flow (a booking
// awaiting bank confirmation); "ticket_issued" covers the cash/reference
// flow where a ticket is generated immediately.
export type BookingCompleteSummary = {
  kind: "bank_pending" | "ticket_issued";
  reservationNo?: string;
  fromCity?: string;
  toCity?: string;
  travelDate?: string;
  passengers: string[];
  seats: string[];
  amount?: number;
  bank?: string;
  ticketNumbers?: string[];
};

export type City = {
  name: string;
  sys: string;
};
