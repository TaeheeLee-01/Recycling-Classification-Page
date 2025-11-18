// Vercel Serverless Function
// This endpoint can be used for server-side logging or analytics

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const { action, data } = req.body;

            // Log classification requests for analytics
            if (action === 'log_classification') {
                console.log('Classification logged:', {
                    timestamp: new Date().toISOString(),
                    predictions: data.predictions,
                    topClass: data.topClass
                });

                return res.status(200).json({
                    success: true,
                    message: 'Classification logged successfully'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });

        } catch (error) {
            console.error('API Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'Recycling Classification API',
            version: '1.0.0'
        });
    }

    return res.status(405).json({
        success: false,
        message: 'Method not allowed'
    });
};
