import { Context } from 'koa';

export default {
  async getMe(ctx: Context) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }

    const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user.documentId,
      fields: [
        'id',
        'documentId',
        'username',
        'email',
        'provider',
        'confirmed',
        'blocked',
        'createdAt',
        'updatedAt',
        'publishedAt',
      ],
      populate: {
        restaurant: {
          fields: ['documentId'],
        },
        role: {
          fields: ['id', 'name', 'description', 'type'],
        },
      },
    });

    return fullUser;
  },
};
