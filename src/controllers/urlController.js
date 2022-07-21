const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13665,
  "redis-13665.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Id1Km5GkgaOYSwoOFluI4oAvomkz91Iw", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// Validataion for empty request body
const checkBodyParams = function (value) {
  if (Object.keys(value).length === 0) return false;
  else return true;
};

// Validation for Strings/ Empty strings
const isEmpty = function (value) {
  if (typeof value !== "string") return false;
  else if (value.trim().length == 0) return false;
  else return true;
};

//......................................... Create Short Url ......................................//
const createShortUrl = async function (req, res) {
  try {
    let data = req.body;

    if (!checkBodyParams(data)) {
      return res
        .status(400)
        .send({ status: false, message: "Missing Parameters" });
    }
    let longUrl = data.longUrl;
    const baseUrl = "http://localhost:3000/";

    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is mandatory" });
    } else if (!isEmpty(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is in wrong format" });
    }

    let found = false; // Using axios to check for correct longurl
    await axios
      .get(longUrl)
      .then((response) => {
        if (response.status == 200 || response.status == 201) found = true;
      })
      .catch((err) => {});

    if (!found) {
      return res.status(400).send({ status: false, message: "Wrong url" });
    }

    let cahcedProfileData = await GET_ASYNC(`${req.body.longUrl}`);

    if (cahcedProfileData) {
      data = JSON.parse(cahcedProfileData);
      return res
        .status(200)
        .send({
          status: true,
          message: "Short url already generated",
          data: data,
        });
    } else {
      const urlCode = shortid.generate();
      const shortUrl = baseUrl.concat(urlCode);
      data.urlCode = urlCode;
      data.shortUrl = shortUrl;

      
      const existLongUrl = await urlModel.findOne({ longUrl });
      if (!existLongUrl) {
        await urlModel.create(data);
      } else {
        return res
          .status(200)
          .send({
            status: true,
            message: "Short url already generated",
            data: data,
          });
      }
      await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify({ data }));
    }
    return res
      .status(201)
      .send({ status: true, message: "Sucess", data: data });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//.........................................Get Url ......................................//
const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if (!shortid.isValid(urlCode)) {
      //checks for space and special character or length less than 7
      return res.status(400).send({
        status: false,
        message: "Invalid url code",
      });
    }
    let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`);

    if (cahcedProfileData) {
      return res.redirect(JSON.parse(cahcedProfileData).longUrl);
    } else {
      let originalUrl = await urlModel
        .findOne({ urlCode: urlCode }).select({ longUrl: 1, _id: 0 });
      if (originalUrl) {
        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(originalUrl));
        return res.redirect(originalUrl.longUrl);
      } else {
        return res.status(400).send({
          status: false,
          message: "Url not found",
        });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createShortUrl, getUrl };
