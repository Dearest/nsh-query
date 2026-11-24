import { ErrorBoundary, signal, Text, View } from "nsh";
import { MutationCache, QueryClient, QueryClientContext, QueryClientProvider, useMutation } from "nsh-query";
import type { MutationFunctionContext } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

/** A callback's context as a log can hold it: `client` is whether it is the scenario's client. */
const contextOf = (context: MutationFunctionContext, client: QueryClient) => ({ ...context, client: context.client === client });

const failingFn = () =>
  sleep(10).then(() => {
    throw new Error("Expected mock error");
  });

const scenarios: Record<string, Scenario> = {
  "should be able to throw an error when throwOnError is set to true": () => {
    function Page() {
      const mutation = useMutation<string, Error>(() => ({
        mutationFn: () => Promise.reject(new Error("Expected mock error. All is well!")),
        throwOnError: true,
      }));
      return <Button label="mutate" onPress={() => mutation.mutate()} />;
    }
    return (
      <ErrorBoundary fallback={<Text>error</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should be able to throw an error when throwOnError is a function that returns true": () => {
    let boundary = false;
    function Page() {
      const mutation = useMutation<string, Error>(() => ({
        mutationFn: () => Promise.reject(new Error("mock error")),
        throwOnError: () => {
          boundary = !boundary;
          return !boundary;
        },
      }));
      return (
        <View>
          <Button label="mutate" onPress={() => mutation.mutate()} />
          <Text>{mutation.error ? mutation.error.message : ""}</Text>
        </View>
      );
    }
    return (
      <ErrorBoundary fallback={<Text>error boundary</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should not throw an error when throwOnError is set to false": () => {
    const mutation = useMutation<string, Error>(() => ({ mutationFn: failingFn, throwOnError: false }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate()} />
        <Text>{`error: ${mutation.error?.message ?? "null"}`}</Text>
      </View>
    );
  },

  "should not throw an error when throwOnError is a function that returns false": () => {
    const mutation = useMutation<string, Error>(() => ({ mutationFn: failingFn, throwOnError: () => false }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate()} />
        <Text>{`error: ${mutation.error?.message ?? "null"}`}</Text>
      </View>
    );
  },

  "should not throw an error when throwOnError is not set": () => {
    const mutation = useMutation<string, Error>(() => ({ mutationFn: failingFn }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate()} />
        <Text>{`error: ${mutation.error?.message ?? "null"}`}</Text>
      </View>
    );
  },

  "should pass meta to mutation on success": () => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: (_, __, ___, mutation) => log({ success: mutation.meta?.["metaSuccessMessage"] }),
      }),
    });
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => Promise.resolve(""),
        meta: { metaSuccessMessage: "mutation succeeded" },
      }));
      return (
        <View>
          <Button label="succeed" onPress={() => mutation.mutate()} />
          <If when={mutation.isSuccess}>
            <Text>successTest</Text>
          </If>
        </View>
      );
    }
    return (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );
  },

  "should pass meta to mutation on error": () => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError: (_, __, ___, mutation) => log({ error: mutation.meta?.["metaErrorMessage"] }),
      }),
    });
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (): Promise<string> => {
          throw new Error("");
        },
        meta: { metaErrorMessage: "mutation failed" },
      }));
      return (
        <View>
          <Button label="error" onPress={() => mutation.mutate()} />
          <If when={mutation.isError}>
            <Text>errorTest</Text>
          </If>
        </View>
      );
    }
    return (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );
  },

  "should call cache callbacks when unmounted": ({ queryClient }) => {
    const mutationKey = createKey();
    let count = 0;
    function Component() {
      const mutation = useMutation(() => ({
        mutationFn: async (_text: string) => {
          count++;
          log({ count });
          await sleep(10);
          return count;
        },
        mutationKey,
        // Upstream's 0: a pending mutation without observers re-arms its gc timer
        // every gcTime ms, and a chain of 0 ms timers never lets the manual clock move.
        gcTime: 1,
        onSuccess: () => log("onSuccess"),
        onSettled: () => log("onSettled"),
      }));
      return (
        <View>
          <Button
            label="mutate"
            onPress={() =>
              mutation.mutate("todo", {
                onSuccess: () => log("onSuccessMutate"),
                onSettled: () => log("onSettledMutate"),
              })
            }
          />
          <Text>{`data: ${mutation.data ?? "null"}, status: ${mutation.status}, isPaused: ${String(mutation.isPaused)}`}</Text>
        </View>
      );
    }
    const show = signal(true);
    return (
      <View>
        <Button label="hide" onPress={() => show.set(false)} />
        <Button label="inspect" onPress={() => log({ cached: queryClient.getMutationCache().findAll({ mutationKey }).length })} />
        <If when={show()}>
          <Component />
        </If>
      </View>
    );
  },

  "should call mutate callbacks only for the last observer": ({ queryClient }) => {
    let count = 0;
    const mutation = useMutation(() => ({
      mutationFn: async (text: string) => {
        count++;
        log({ count });
        const result = `result-${text}`;
        await sleep(10);
        return result;
      },
      onSuccess: (...args) => log({ onSuccess: [args[0], args[1], args[2], contextOf(args[3], queryClient)] }),
      onSettled: (...args) => log({ onSettled: [args[0], args[1], args[2], args[3], contextOf(args[4], queryClient)] }),
    }));
    const callbacks = {
      onSuccess: (...args: [string, string, unknown, MutationFunctionContext]) =>
        log({ onSuccessMutate: [args[0], args[1], args[2], contextOf(args[3], queryClient)] }),
      onSettled: (...args: [string | undefined, Error | null, string, unknown, MutationFunctionContext]) =>
        log({ onSettledMutate: [args[0], args[1], args[2], args[3], contextOf(args[4], queryClient)] }),
    };
    return (
      <View>
        <Button label="mutate1" onPress={() => mutation.mutate("todo1", callbacks)} />
        <Button label="mutate2" onPress={() => mutation.mutate("todo2", callbacks)} />
        <Text>{`data: ${mutation.data ?? "null"}, status: ${mutation.status}`}</Text>
      </View>
    );
  },

  "should go to error state if onSuccess callback errors": ({ queryClient }) => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) => sleep(10).then(() => "result"),
      onSuccess: () => Promise.reject(new Error("error from onSuccess")),
      onError: (...args) => log({ onError: [args[0], args[1], args[2], contextOf(args[3], queryClient)] }),
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>{`status: ${mutation.status}`}</Text>
      </View>
    );
  },

  "should go to error state if onError callback errors": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("mutateFnError");
        }),
      onError: () => Promise.reject(new Error("error from onError")),
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>{`error: ${mutation.error instanceof Error ? mutation.error.message : "null"}, status: ${mutation.status}`}</Text>
      </View>
    );
  },

  "should go to error state if onSettled callback errors": ({ queryClient }) => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("mutateFnError");
        }),
      onSettled: () => Promise.reject(new Error("error from onSettled")),
      onError: (...args) => log({ onError: [args[0], args[1], args[2], contextOf(args[3], queryClient)] }),
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>{`error: ${mutation.error instanceof Error ? mutation.error.message : "null"}, status: ${mutation.status}`}</Text>
      </View>
    );
  },

  "should use provided custom queryClient": ({ queryClient }) => {
    function Page() {
      const mutation = useMutation(() => ({ mutationFn: (text: string) => Promise.resolve(text) }), queryClient);
      return (
        <View>
          <Button label="mutate" onPress={() => mutation.mutate("custom client")} />
          <Text>{`data: ${mutation.data ?? "null"}, status: ${mutation.status}`}</Text>
        </View>
      );
    }
    return (
      <QueryClientContext.Provider value={undefined}>
        <Page />
      </QueryClientContext.Provider>
    );
  },

  "should update the cache in onMutate and roll back via onMutateResult in onError": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData<string[]>(key, ["Todo 1"]);
    const mutation = useMutation(() => ({
      mutationFn: () => sleep(10).then(() => Promise.reject(new Error("Some error"))),
      onMutate: async (newTodo: string) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previousTodos = queryClient.getQueryData<string[]>(key);
        queryClient.setQueryData<string[]>(key, (old) => [...(old ?? []), newTodo]);
        return { previousTodos };
      },
      onError: (_err, _newTodo, onMutateResult) => {
        queryClient.setQueryData(key, onMutateResult?.previousTodos);
      },
    }));
    return (
      <View>
        <Button label="add" onPress={() => mutation.mutate("Todo 2")} />
        <Button label="inspect" onPress={() => log(queryClient.getQueryData(key))} />
      </View>
    );
  },

  "should keep the optimistic update in place when the mutation succeeds": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData<string[]>(key, ["Todo 1"]);
    const mutation = useMutation(() => ({
      mutationFn: (newTodo: string) => sleep(10).then(() => newTodo),
      onMutate: async (newTodo: string) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previousTodos = queryClient.getQueryData<string[]>(key);
        queryClient.setQueryData<string[]>(key, (old) => [...(old ?? []), newTodo]);
        return { previousTodos };
      },
    }));
    return (
      <View>
        <Button label="add" onPress={() => mutation.mutate("Todo 2")} />
        <Button label="inspect" onPress={() => log(queryClient.getQueryData(key))} />
      </View>
    );
  },

  "should be able to run multiple mutateAsync calls in parallel with Promise.all": () => {
    const result = signal("idle");
    const mutation = useMutation(() => ({ mutationFn: (file: string) => sleep(10).then(() => `uploaded: ${file}`) }));
    const uploadAll = async () => {
      const results = await Promise.all([mutation.mutateAsync("file1"), mutation.mutateAsync("file2"), mutation.mutateAsync("file3")]);
      result.set(results.join(", "));
    };
    return (
      <View>
        <Button label="upload all" onPress={() => void uploadAll()} />
        <Text>{`result: ${result()}`}</Text>
      </View>
    );
  },

  "should handle Promise.all rejection when one parallel mutateAsync call fails": () => {
    const result = signal("idle");
    const mutation = useMutation(() => ({
      mutationFn: async (file: string) => {
        await sleep(10);
        if (file === "file2") throw new Error("upload failed");
        return `uploaded: ${file}`;
      },
      retry: false,
    }));
    const uploadAll = async () => {
      try {
        const results = await Promise.all([mutation.mutateAsync("file1"), mutation.mutateAsync("file2"), mutation.mutateAsync("file3")]);
        result.set(results.join(", "));
      } catch (error) {
        result.set(`error: ${(error as Error).message}`);
      }
    };
    return (
      <View>
        <Button label="upload all" onPress={() => void uploadAll()} />
        <Text>{`result: ${result()}`}</Text>
      </View>
    );
  },

  "should handle partial failure in parallel mutateAsync calls with Promise.allSettled": () => {
    const result = signal("idle");
    const mutation = useMutation(() => ({
      mutationFn: async (file: string) => {
        await sleep(10);
        if (file === "file2") throw new Error("upload failed");
        return `uploaded: ${file}`;
      },
      retry: false,
    }));
    const uploadAll = async () => {
      const results = await Promise.allSettled([
        mutation.mutateAsync("file1"),
        mutation.mutateAsync("file2"),
        mutation.mutateAsync("file3"),
      ]);
      result.set(results.map((r) => (r.status === "fulfilled" ? r.value : `error: ${(r.reason as Error).message}`)).join(", "));
    };
    return (
      <View>
        <Button label="upload all" onPress={() => void uploadAll()} />
        <Text>{`result: ${result()}`}</Text>
      </View>
    );
  },

  "should pass a non-undefined onMutateResult alongside context to onSuccess": ({ queryClient }) => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text.toUpperCase()),
      onMutate: (text: string) => ({ startedWith: text }),
      onSuccess: (...args) => log({ onSuccess: [args[0], args[1], args[2], contextOf(args[3], queryClient)] }),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo")} />;
  },

  "should give mutationFn the same QueryClient instance via context": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "tag-from-this-client");
    const mutation = useMutation(() => ({
      mutationFn: (_text: string, context: MutationFunctionContext) => sleep(10).then(() => context.client.getQueryData(key)),
    }));
    return (
      <View>
        <Text>{`data: ${String(mutation.data)}`}</Text>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
      </View>
    );
  },

  "should include mutationKey in the context passed to hook-level callbacks": () => {
    const mutation = useMutation(() => ({
      mutationKey: ["todos", "add"],
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSuccess: (_data, _variables, _onMutateResult, context) => log({ mutationKey: context.mutationKey }),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo")} />;
  },

  "should let onSuccess invalidate queries via context.client without a useQueryClient() closure": ({ queryClient }) => {
    const key = createKey();
    queryClient.setQueryData(key, "data");
    const mutation = useMutation(() => ({
      mutationFn: () => sleep(10).then(() => "mutated"),
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        void context.client.invalidateQueries({ queryKey: key });
      },
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate()} />
        <Button label="inspect" onPress={() => log({ isInvalidated: queryClient.getQueryState(key)?.isInvalidated })} />
      </View>
    );
  },

  // Cases only react-query's suite has.

  "should be able to call `onSuccess` callback after successful mutate": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSuccess: () => log("useMutation.onSuccess"),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onSuccess: () => log("mutate.onSuccess") })} />;
  },

  "should be able to call `onError` callback after failed mutate": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
      onError: () => log("useMutation.onError"),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onError: () => log("mutate.onError") })} />;
  },

  "should be able to call `onSettled` callback after mutate": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSettled: () => log("useMutation.onSettled"),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onSettled: () => log("mutate.onSettled") })} />;
  },

  "should be able to call `onSuccess` callback after successful mutateAsync": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSuccess: () => log("useMutation.onSuccess"),
    }));
    setTimeout(() => {
      void mutation.mutateAsync("todo", { onSuccess: () => log("mutateAsync.onSuccess") });
    }, 0);
    return <View />;
  },

  "should be able to call `onError` callback after failed mutateAsync": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
      onError: () => log("useMutation.onError"),
    }));
    setTimeout(() => {
      mutation.mutateAsync("todo", { onError: () => log("mutateAsync.onError") }).catch(() => {});
    }, 0);
    return <View />;
  },

  "should be able to call `onSettled` callback after mutateAsync": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSettled: () => log("useMutation.onSettled"),
    }));
    setTimeout(() => {
      void mutation.mutateAsync("todo", { onSettled: () => log("mutateAsync.onSettled") });
    }, 0);
    return <View />;
  },

  "should be able to override the error callbacks when using mutate": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) => sleep(10).then(() => Promise.reject(new Error("oops"))),
      onError: () => log("useMutation.onError"),
      onSettled: () => log("useMutation.onSettled"),
    }));
    return (
      <Button
        label="mutate"
        onPress={() =>
          mutation.mutate("todo", {
            onError: () => log("mutate.onError"),
            onSettled: () => log("mutate.onSettled"),
          })
        }
      />
    );
  },

  "should be able to override the settled callbacks when using mutate": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => sleep(10).then(() => text),
      onSuccess: () => log("useMutation.onSuccess"),
      onSettled: () => log("useMutation.onSettled"),
    }));
    return (
      <Button
        label="mutate"
        onPress={() =>
          mutation.mutate("todo", {
            onSuccess: () => log("mutate.onSuccess"),
            onSettled: () => log("mutate.onSettled"),
          })
        }
      />
    );
  },

  "should be able to chain mutateAsync calls sequentially": () => {
    const result = signal("idle");
    const createUser = useMutation(() => ({ mutationFn: (name: string) => sleep(10).then(() => ({ id: "1", name })) }));
    const updateProfile = useMutation(() => ({
      mutationFn: (userId: string) => sleep(10).then(() => `profile updated for ${userId}`),
    }));
    const chain = async () => {
      const user = await createUser.mutateAsync("new user");
      const profile = await updateProfile.mutateAsync(user.id);
      result.set(profile);
    };
    return (
      <View>
        <Button label="chain" onPress={() => void chain()} />
        <Text>{`result: ${result()}`}</Text>
      </View>
    );
  },

  "should handle error in chained mutateAsync calls": () => {
    const result = signal("idle");
    const createUser = useMutation(() => ({
      mutationFn: (_name: string) =>
        sleep(10).then<{ id: string }>(() => {
          throw new Error("create failed");
        }),
    }));
    const updateProfile = useMutation(() => ({
      mutationFn: (userId: string) => sleep(10).then(() => `profile updated for ${userId}`),
    }));
    const chain = async () => {
      try {
        const user = await createUser.mutateAsync("new user");
        const profile = await updateProfile.mutateAsync(user.id);
        result.set(profile);
      } catch (error) {
        result.set(`error: ${(error as Error).message}`);
      }
    };
    return (
      <View>
        <Button label="chain" onPress={() => void chain()} />
        <Text>{`result: ${result()}`}</Text>
      </View>
    );
  },

  "should set success message from mutate callbacks when mutation succeeds": () => {
    const message = signal("idle");
    const mutation = useMutation(() => ({
      mutationFn: (shouldFail: boolean) =>
        sleep(10).then(() => {
          if (shouldFail) throw new Error("submission failed");
          return "submitted successfully";
        }),
      retry: false,
    }));
    return (
      <View>
        <Button
          label="submit"
          onPress={() =>
            mutation.mutate(false, {
              onSuccess: (result) => message.set(`success: ${result}`),
              onError: (error) => message.set(`error: ${error.message}`),
            })
          }
        />
        <Text>{`message: ${message()}`}</Text>
      </View>
    );
  },

  "should set error message from mutate callbacks when mutation fails": () => {
    const message = signal("idle");
    const mutation = useMutation(() => ({
      mutationFn: (shouldFail: boolean) =>
        sleep(10).then(() => {
          if (shouldFail) throw new Error("submission failed");
          return "submitted successfully";
        }),
      retry: false,
    }));
    return (
      <View>
        <Button
          label="submit fail"
          onPress={() =>
            mutation.mutate(true, {
              onSuccess: (result) => message.set(`success: ${result}`),
              onError: (error) => message.set(`error: ${error.message}`),
            })
          }
        />
        <Text>{`message: ${message()}`}</Text>
      </View>
    );
  },

  "should handle conditional error with retry using mutate": () => {
    let attempt = 0;
    const message = signal("idle");
    const mutation = useMutation(() => ({
      mutationFn: () =>
        sleep(10).then(() => {
          attempt++;
          if (attempt < 2) throw new Error("temporary failure");
          return "success";
        }),
      retry: false,
    }));
    return (
      <View>
        <Button
          label="submit"
          onPress={() =>
            mutation.mutate(undefined, {
              onSuccess: (result) => message.set(`result: ${result}`),
              onError: () => message.set("failed, retrying..."),
            })
          }
        />
        <Text>{`message: ${message()}`}</Text>
      </View>
    );
  },

  "should support optimistic update on success": () => {
    const items = signal(["item1", "item2", "item3"]);
    const successMessage = signal("");
    const mutation = useMutation(() => ({
      mutationFn: (item: string) => sleep(10).then(() => item),
      onMutate: (item: string) => {
        const previousItems = [...items()];
        items.set(items().filter((i) => i !== item));
        return { previousItems };
      },
      onSuccess: (deletedItem) => successMessage.set(`deleted: ${deletedItem}`),
      onError: (_error, _item, context) => {
        if (context?.previousItems) items.set(context.previousItems);
      },
    }));
    return (
      <View>
        <Each of={items()}>{(item) => <Button label={`delete ${item()}`} onPress={() => mutation.mutate(item())} />}</Each>
        <Text>{`items: ${items().join(", ")}`}</Text>
        <Text>{`success: ${successMessage() || "none"}`}</Text>
      </View>
    );
  },

  "should support optimistic update and rollback on error": () => {
    const items = signal(["item1", "item2", "item3"]);
    const message = signal("");
    const mutation = useMutation(() => ({
      mutationFn: (item: string) =>
        sleep(10).then(() => {
          throw new Error(`Failed to delete ${item}`);
        }),
      onMutate: (item: string) => {
        const previousItems = [...items()];
        items.set(items().filter((i) => i !== item));
        return { previousItems };
      },
      onSuccess: (deletedItem) => message.set(`deleted: ${deletedItem}`),
      onError: (_error, _item, context) => {
        message.set("rollback");
        if (context?.previousItems) items.set(context.previousItems);
      },
      retry: false,
    }));
    return (
      <View>
        <Each of={items()}>{(item) => <Button label={`delete ${item()}`} onPress={() => mutation.mutate(item())} />}</Each>
        <Text>{`items: ${items().join(", ")}`}</Text>
        <Text>{`message: ${message() || "none"}`}</Text>
      </View>
    );
  },
};

runScenarios(scenarios);
