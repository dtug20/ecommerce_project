import { apiSlice } from '@/redux/api/apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation({
      query: (body) => ({
        url: '/api/v1/store/chat/message',
        method: 'POST',
        body,
      }),
    }),
    submitChatFeedback: builder.mutation({
      query: (body) => ({
        url: '/api/v1/store/chat/feedback',
        method: 'POST',
        body,
      }),
    }),
    getChatSession: builder.query({
      query: (id) => `/api/v1/store/chat/sessions/${id}`,
    }),
    endChatSession: builder.mutation({
      query: (id) => ({
        url: `/api/v1/store/chat/sessions/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useSendChatMessageMutation,
  useSubmitChatFeedbackMutation,
  useGetChatSessionQuery,
  useEndChatSessionMutation,
} = chatApi;
