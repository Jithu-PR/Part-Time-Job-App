export default {
  routes: [
    {
      method: 'GET',
      path: '/me',
      handler: 'me.getMe',
      config: {
        auth: {},
      },
    },
  ],
};
