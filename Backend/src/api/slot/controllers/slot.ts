import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::slot.slot', ({ strapi }) => ({
    async create(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be logged in to book a slot');
        }

        const { job, restaurant, startDateTime, slotStatus } = ctx.request.body?.data ?? {};

        const entity = await strapi.entityService.create('api::slot.slot', {
            data: {
                job: { connect: [job] }, // must use connect for Strapi 5
                restaurant: { connect: [restaurant] }, // must use connect
                startDateTime,
                slotStatus: slotStatus || 'booked',
                booked_by: { connect: [user.documentId] }, // 🔥 use documentId + connect
            } as any,
        });

        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },
}));