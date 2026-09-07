import Booking from "../models/booking.js";

export const createAIBooking = async (data) => {

    return await Booking.create({

        provider: data.providerId,

        date: data.date,

        time: data.time,

        status: "pending"

    });

};