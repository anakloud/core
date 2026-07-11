import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "@/lib/api-client";
import {
  SERVICES_QUERY,
  CREATE_SERVICE_MUTATION,
  UPDATE_SERVICE_MUTATION,
  DELETE_SERVICE_MUTATION,
} from "@/lib/graphql/documents";
import type { ServicesResult, ServiceInput } from "@/lib/graphql/types";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => gqlClient.request<ServicesResult>(SERVICES_QUERY),
    select: (data) => data.services,
  });
}

function useServiceMutation<TVars>(document: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVars) => gqlClient.request(document, variables as object),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useCreateService() {
  return useServiceMutation<{ input: ServiceInput }>(CREATE_SERVICE_MUTATION);
}

export function useUpdateService() {
  return useServiceMutation<{ id: string; input: Partial<ServiceInput> }>(
    UPDATE_SERVICE_MUTATION,
  );
}

export function useDeleteService() {
  return useServiceMutation<{ id: string }>(DELETE_SERVICE_MUTATION);
}
