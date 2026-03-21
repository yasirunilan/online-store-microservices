import mongoose from 'mongoose';

const USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  john: '00000000-0000-0000-0000-000000000002',
  jane: '00000000-0000-0000-0000-000000000003',
  bob: '00000000-0000-0000-0000-000000000004',
  alice: '00000000-0000-0000-0000-000000000005',
};

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    recipientUserId: { type: String, required: true },
    payload: { type: Object },
    status: { type: String, default: 'sent' },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

const Notification = mongoose.model('Notification', notificationSchema);

async function main() {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/notifications';
  await mongoose.connect(mongoUri);

  const notifications = [
    {
      type: 'welcome_email',
      recipientEmail: 'john@example.com',
      recipientUserId: USER_IDS.john,
      payload: { firstName: 'John' },
      status: 'sent',
    },
    {
      type: 'welcome_email',
      recipientEmail: 'jane@example.com',
      recipientUserId: USER_IDS.jane,
      payload: { firstName: 'Jane' },
      status: 'sent',
    },
    {
      type: 'welcome_email',
      recipientEmail: 'bob@example.com',
      recipientUserId: USER_IDS.bob,
      payload: { firstName: 'Bob' },
      status: 'sent',
    },
    {
      type: 'welcome_email',
      recipientEmail: 'alice@example.com',
      recipientUserId: USER_IDS.alice,
      payload: { firstName: 'Alice' },
      status: 'sent',
    },
    {
      type: 'order_confirmation',
      recipientEmail: 'john@example.com',
      recipientUserId: USER_IDS.john,
      payload: { orderId: '30000000-0000-0000-0000-000000000001', totalAmount: 1499.98 },
      status: 'sent',
    },
    {
      type: 'order_confirmation',
      recipientEmail: 'jane@example.com',
      recipientUserId: USER_IDS.jane,
      payload: { orderId: '30000000-0000-0000-0000-000000000002', totalAmount: 99.98 },
      status: 'sent',
    },
    {
      type: 'order_status_update',
      recipientEmail: 'bob@example.com',
      recipientUserId: USER_IDS.bob,
      payload: { orderId: '30000000-0000-0000-0000-000000000003', newStatus: 'SHIPPED' },
      status: 'sent',
    },
    {
      type: 'order_status_update',
      recipientEmail: 'alice@example.com',
      recipientUserId: USER_IDS.alice,
      payload: { orderId: '30000000-0000-0000-0000-000000000004', newStatus: 'DELIVERED' },
      status: 'sent',
    },
    {
      type: 'order_confirmation',
      recipientEmail: 'admin@online-store.com',
      recipientUserId: USER_IDS.admin,
      payload: { orderId: '30000000-0000-0000-0000-000000000007', totalAmount: 329.98 },
      status: 'sent',
    },
  ];

  // Clear existing seed data and re-insert for idempotency
  await Notification.deleteMany({
    recipientUserId: { $in: Object.values(USER_IDS) },
  });
  await Notification.insertMany(notifications);

  console.log('Notification seed completed: 9 notifications created');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
