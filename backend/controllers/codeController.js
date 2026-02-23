const axios = require("axios");

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50
};

exports.executeCode = async (req, res) => {

  try {

    const { code, language, input } = req.body;

    if (!code || !language) {

      return res.status(400).json({
        success: false,
        message: "Code and language required"
      });

    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];

    if (!languageId) {

      return res.status(400).json({
        success: false,
        message: "Unsupported language"
      });

    }


    // IMPORTANT FIX HERE

    const response = await axios({

      method: "POST",

      url: `${process.env.JUDGE0_API_URL}/submissions`,

      params: {
        base64_encoded: false,
        wait: true
      },

      headers: {
        "Content-Type": "application/json"
      },

      data: {

        language_id: languageId,

        source_code: code,

        stdin: input || ""

      }

    });


    const result = response.data;


    let output =
      result.stdout ||
      result.stderr ||
      result.compile_output ||
      result.message ||
      "No Output";


    return res.json({

      success: true,

      output,

      status: result.status.description

    });


  }

  catch (error) {

    console.log(error.response?.data || error.message);

    res.status(500).json({

      success: false,

      error: error.response?.data || error.message

    });

  }

};