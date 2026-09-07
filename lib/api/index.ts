import { ENDPOINTS } from "../constants";
import type {
  ApiMessage,
  Booking,
  CancellationPolicy,
  GenerateTicketsResponse,
  IssuedTicket,
  LoginResponse,
  OfechoRow,
  Profile,
  RouteSalesData,
  SearchResult,
  Ticket,
  TicketListItem,
  TicketReport,
  TripDetail,
} from "../types";
import { citySearchName } from "../cities";
import { apiRequest } from "./client";

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const row = payload as { data?: unknown; trips?: unknown };
    if (Array.isArray(row.data)) return row.data as T[];
    if (Array.isArray(row.trips)) return row.trips as T[];
  }
  return [];
}

/**
 * 1:1 with the Flutter agent providers in
 * `/biftu bus/agent/lib/api/provider/*`
 * Base URL: https://biftubus-api.liyubus.com
 */
export const api = {
  // LoginService.loginUser
  login(phone: string, password: string) {
    return apiRequest<LoginResponse>(ENDPOINTS.login, {
      method: "POST",
      auth: false,
      apiKey: true,
      json: { phone, password },
    });
  },

  // ProfileService.getProfle  GET /agent/profile
  getProfile() {
    return apiRequest<Profile>(ENDPOINTS.profile);
  },

  // ProfileService.updateProfile  PUT /agent/update-profile
  updatePassword(oldPassword: string, newPassword: string) {
    return apiRequest<ApiMessage>(ENDPOINTS.updateProfile, {
      method: "PUT",
      form: { oldPassword, newPassword },
    });
  },

  // CitiesService.getAllCityNames  GET /city/name
  getCityNames() {
    return apiRequest<unknown>(ENDPOINTS.cityNames);
  },

  // CitiesService.getAllCities  GET /cities
  getCities() {
    return apiRequest<unknown>(ENDPOINTS.cities, { auth: false });
  },

  // TripService.searchTrip  POST /trips/search/agent
  async searchTrips(from: string, to: string, date: string) {
    const data = await apiRequest<SearchResult[]>(ENDPOINTS.searchTrip, {
      method: "POST",
      form: {
        from: citySearchName(from),
        to: citySearchName(to),
        date,
      },
    });
    return asList<SearchResult>(data);
  },

  // TripService.searchTripByDate  POST /trips/search/date/:date/agent
  async searchTripsByDate(date: string) {
    const data = await apiRequest<SearchResult[]>(ENDPOINTS.searchTripByDate(date), {
      method: "POST",
    });
    return asList<SearchResult>(data);
  },

  // TripService.getTripById  GET /trips/:id
  getTrip(id: number) {
    return apiRequest<TripDetail>(ENDPOINTS.tripById(id));
  },

  // TripService.getTripByModel  GET /trips/formatted-seats/:id
  async getFormattedSeats(id: number) {
    const data = await apiRequest<number[]>(ENDPOINTS.formattedSeats(id));
    return Array.isArray(data) ? data.map(Number).filter((n) => !Number.isNaN(n)) : [];
  },

  // BookingService.firstSeatHandler  POST /booking/agent
  reserveFirstSeat(seat: string, busId: number, tripId: number, selectedRoute: string) {
    return apiRequest<ApiMessage<number>>(ENDPOINTS.firstSeat, {
      method: "POST",
      json: { seat, busId, tripId, selectedRoute },
    });
  },

  // BookingService.updateSeatArrangement  PUT /booking/update-seat/:bookingId/seat/:seat
  addSeat(bookingId: number, seat: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.updateSeat(bookingId, seat), {
      method: "PUT",
    });
  },

  // BookingService.removeSeat  PUT /booking/remove-seat/:seat/booking/:bookingId
  removeSeat(seat: number, bookingId: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.removeSeat(seat, bookingId), {
      method: "PUT",
    });
  },

  // BookingService.addPassegengerData  POST /booking/passgenger-data/:id
  addPassengerData(
    bookingId: number,
    data: { pickup?: string; dropoff?: string; passengers: string; phoneNumber: string },
  ) {
    return apiRequest<ApiMessage>(ENDPOINTS.passengerData(bookingId), {
      method: "POST",
      form: {
        pickup: data.pickup ?? "",
        dropoff: data.dropoff ?? "",
        passengers: data.passengers,
        phoneNumber: data.phoneNumber,
      },
    });
  },

  // BookingService.getBooking  GET /booking/:id
  getBooking(id: number) {
    return apiRequest<Booking>(ENDPOINTS.booking(id));
  },

  // BookingService.updateBookingStatusToSeatAdded  POST /booking/update-status/:id
  updateBookingStatus(id: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.updateBookingStatus(id), {
      method: "POST",
      form: { status: "SEAT_ADDED" },
    });
  },

  // BookingService.updateBookingPaymentData  PUT /booking/payment-data/:id
  updatePayment(bookingId: number, paymentOption: string, referenceNumber: string) {
    return apiRequest<ApiMessage>(ENDPOINTS.paymentData(bookingId), {
      method: "PUT",
      form: { paymentOption, referenceNumber },
    });
  },

  // BookingService.deleteBooking  DELETE /booking/:id
  deleteBooking(id: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.booking(id), { method: "DELETE" });
  },

  // BookingService.sendCancellationRequest  PUT /refunds/request-cancellation
  sendCancellationRequest(ticketId: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.refundRequest, {
      method: "PUT",
      form: { ticketId: String(ticketId) },
    });
  },

  // BookingService.sendTopUpRequest  POST /top-up-request
  sendTopUp(payload: {
    bank: string;
    depositor: string;
    reference_number: string;
    amount: number;
  }) {
    return apiRequest<ApiMessage>(ENDPOINTS.topUp, {
      method: "POST",
      json: payload,
    });
  },

  // TicketService.issueTicket  POST /tickets/generate/agent
  generateTickets(bookingID: string | number) {
    return apiRequest<GenerateTicketsResponse>(ENDPOINTS.generateTickets, {
      method: "POST",
      json: { bookingID: String(bookingID), printed: true },
    });
  },

  // TicketService.issueTicketShortly  POST /tickets/issue/agent
  issueTicketShort(payload: { passenger: string; tripId: number; phoneNumber: string }) {
    return apiRequest<ApiMessage<IssuedTicket>>(ENDPOINTS.issueTicket, {
      method: "POST",
      json: {
        passenger: payload.passenger,
        tripId: payload.tripId,
        phoneNumber: payload.phoneNumber,
      },
    });
  },

  // TicketService.getTicket / getTicketByTicketNumber  GET /tickets/ticket-number/:no
  getTicketByNumber(ticketNumber: string) {
    return apiRequest<Ticket>(ENDPOINTS.ticketByNumber(ticketNumber));
  },

  // TicketService.cancelTicket  POST /refunds/request-cancellation/agent
  cancelTicket(ticketId: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.cancelTicket, {
      method: "POST",
      form: { ticketId: String(ticketId) },
    });
  },

  // TicketService.activateTicket  PUT /tickets/activate-ticket/:id
  activateTicket(ticketId: number) {
    return apiRequest<ApiMessage>(ENDPOINTS.activateTicket(ticketId), {
      method: "PUT",
    });
  },

  // TicketService.getBookedTicket  GET /tickets/agent/booked
  async getBookedTickets() {
    return asList<TicketListItem>(await apiRequest<unknown>(ENDPOINTS.bookedTickets));
  },

  // TicketService.getCancelledTicket  GET /tickets/agent/cancelled
  async getCancelledTickets() {
    return asList<TicketListItem>(await apiRequest<unknown>(ENDPOINTS.cancelledTickets));
  },

  // TicketService.updateTicket  PUT /tickets/:id
  updateTicket(id: number, passenger: string, phoneNumber: string) {
    return apiRequest<ApiMessage>(ENDPOINTS.updateTicket(id), {
      method: "PUT",
      form: { passenger, phoneNumber },
    });
  },

  // TicketService.getConductorReport  GET /report/ticket/:type
  getTicketReport(type: string) {
    return apiRequest<TicketReport>(ENDPOINTS.ticketReport(type));
  },

  // TicketService.ofechoReport  GET /report/ticket/ofecho
  async getOfechoReport() {
    return asList<OfechoRow>(await apiRequest<unknown>(ENDPOINTS.ofechoReport));
  },

  // TicketService.routeSalesData  GET /agent/self-sales-report/:start/:end
  async getSalesReport(startDate: string, endDate: string) {
    return asList<RouteSalesData>(await apiRequest<unknown>(ENDPOINTS.salesReport(startDate, endDate)));
  },

  // CancellationPolicyService.getCancellationPolicy  GET /cancellation-policy/agent
  async getCancellationPolicy() {
    return asList<CancellationPolicy>(await apiRequest<unknown>(ENDPOINTS.cancellationPolicy));
  },
};
