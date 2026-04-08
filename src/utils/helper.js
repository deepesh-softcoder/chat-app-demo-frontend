// helpers.js

export const mapGiftedToServer = (msg) => ({
    _id: msg._id,
    text: msg.text,
    createdAt: msg.createdAt,
    user: {
      _id: msg.user._id,
      name: msg.user.name,
    },
  });
  
  export const mapServerToGifted = (msg) => ({
    _id: msg._id,
    text: msg.text,
    createdAt: new Date(msg.createdAt),
    user: {
      _id: msg.user._id,
      name: msg.user.name,
    },
  });
  