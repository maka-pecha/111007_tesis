module.exports.getChat = async (pubnub,channel) => {
    const messages = await pubnub.fetchMessages(
        {
            channels: [channel],
            end: '15343325004275466',
            count: 10
        })
    return messages.channels[channel]
}