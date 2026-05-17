const llm = require('./llmProvider');
const tools = require('./tools');
const config = require('../../config/gemini');

async function runTurn({ systemInstruction, history, userMessage, context, onToken, onToolCall, maxIterations }) {
  const maxIters = maxIterations || config.maxToolCallsPerTurn;
  const toolCalls = [];
  const suggestedActions = [];
  let iterations = 0;
  let finalText = '';
  let usage = { promptTokenCount: 0, candidatesTokenCount: 0 };
  let workingHistory = [...history];
  let workingMessage = `<user_message>${userMessage}</user_message>`;
  let cappedOut = false;

  while (iterations < maxIters) {
    iterations += 1;
    const res = await llm.streamChat({
      systemInstruction,
      history: workingHistory,
      userMessage: workingMessage,
      tools: tools.getDeclarations(),
      onToken
    });
    usage.promptTokenCount += res.usage.promptTokenCount || 0;
    usage.candidatesTokenCount += res.usage.candidatesTokenCount || 0;

    if (!res.toolCalls || res.toolCalls.length === 0) {
      finalText = res.text;
      break;
    }

    const toolResults = [];
    for (const call of res.toolCalls) {
      const dispatched = await tools.dispatch(call.name, call.args, context);
      toolCalls.push({
        toolName: call.name,
        args: call.args,
        result: dispatched.result || null,
        error: dispatched.error || null,
        durationMs: dispatched.durationMs || 0
      });
      if (onToolCall) onToolCall({ name: call.name, args: call.args, result: dispatched });
      const payload = dispatched.error ? { error: dispatched.error, message: dispatched.message } : dispatched.result;
      if (payload && payload.suggestedAction) suggestedActions.push(payload.suggestedAction);
      toolResults.push({ name: call.name, response: payload });
    }

    // Append the user message that prompted this iteration BEFORE the model
    // response — Gemini requires conversation history to alternate user/model
    // and to start with role 'user'. On the first iteration of a brand-new
    // session, skipping this step left history = [model, function] for the
    // next iteration and tripped "First content should be with role 'user'".
    if (workingMessage) {
      workingHistory.push({ role: 'user', parts: [{ text: workingMessage }] });
    }
    workingHistory.push({ role: 'model', parts: [{ functionCall: res.toolCalls[0] }] });
    workingHistory.push({ role: 'function', parts: toolResults.map((r) => ({ functionResponse: { name: r.name, response: r.response } })) });
    workingMessage = '';
  }

  if (iterations >= maxIters && !finalText) cappedOut = true;

  return { text: finalText, toolCalls, suggestedActions, iterations, cappedOut, usage };
}

module.exports = { runTurn };
