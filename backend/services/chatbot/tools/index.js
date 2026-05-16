const tools = {};

function register(tool) {
  if (!tool.name) throw new Error('tool.name required');
  tools[tool.name] = tool;
}

function getDeclarations() {
  return Object.values(tools).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));
}

async function dispatch(name, args, context) {
  const t = tools[name];
  if (!t) return { error: 'unknown_tool', message: `No such tool: ${name}` };
  if (t.requiresAuth && !context.isAuthenticated) {
    return { error: 'auth_required', message: 'Please sign in to use this feature.' };
  }
  const start = Date.now();
  try {
    const result = await t.handler(args || {}, context);
    return { result, durationMs: Date.now() - start };
  } catch (e) {
    console.error(`[chatbot] tool ${name} failed:`, e.message);
    return { error: 'tool_error', message: e.message, durationMs: Date.now() - start };
  }
}

// Register tools
require('./searchProducts')(register);
require('./getProductDetails')(register);
require('./recommendProducts')(register);
require('./getMyOrders')(register);
require('./getOrderStatus')(register);
require('./validateCoupon')(register);
require('./getShippingPolicy')(register);
require('./getReturnPolicy')(register);
require('./searchFAQ')(register);
require('./proposeAddToCart')(register);
require('./proposeApplyCoupon')(register);

module.exports = { register, getDeclarations, dispatch, _tools: tools };
