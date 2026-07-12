import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(req.user._id);

    // Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId,
    });

    // Total Videos, Views and Likes
    const stats = await Video.aggregate([
        {
            $match: {
                owner: channelId,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1,
                },
                totalViews: {
                    $sum: "$views",
                },
                totalLikes: {
                    $sum: {
                        $size: "$likes",
                    },
                },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalSubscribers,
                totalVideos: stats[0]?.totalVideos || 0,
                totalViews: stats[0]?.totalViews || 0,
                totalLikes: stats[0]?.totalLikes || 0,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const aggregate = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    const options = {
        page: Number(page),
        limit: Number(limit),
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos,
};