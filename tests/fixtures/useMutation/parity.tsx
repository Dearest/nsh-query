import { effect, signal, Text, View } from "nsh";
import { useMutation } from "nsh-query";
import type { MutationFunctionContext, QueryClient } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep, snapshot } from "../../support/parity";
import type { Scenario } from "../../support/parity";

/** A callback's context as a log can hold it: `client` is whether it is the scenario's client. */
const contextOf = (context: MutationFunctionContext, client: QueryClient) => ({ ...context, client: context.client === client });

const scenarios: Record<string, Scenario> = {
  "should be able to reset `data`": () => {
    const mutation = useMutation(() => ({ mutationFn: () => Promise.resolve("mutation") }));
    return (
      <View>
        <Text>{`heading: ${mutation.data ?? "empty"}`}</Text>
        <Button label="reset" onPress={() => mutation.reset()} />
        <Button label="mutate" onPress={() => mutation.mutate()} />
      </View>
    );
  },

  "should be able to reset `error`": () => {
    const mutation = useMutation<string, Error>(() => ({
      mutationFn: () => Promise.reject(new Error("Expected mock error. All is well!")),
    }));
    return (
      <View>
        <If when={mutation.error}>
          <Text>{`heading: ${mutation.error?.message}`}</Text>
        </If>
        <Button label="reset" onPress={() => mutation.reset()} />
        <Button label="mutate" onPress={() => mutation.mutate()} />
      </View>
    );
  },

  "should call mutate callbacks when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
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

  "should call mutate error callbacks when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
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

  "should call only mutate onSuccess when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onSuccess: () => log("mutate.onSuccess") })} />;
  },

  "should call only mutate onError when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
    }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onError: () => log("mutate.onError") })} />;
  },

  "should call only mutate onSettled when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
    return <Button label="mutate" onPress={() => mutation.mutate("todo", { onSettled: () => log("mutate.onSettled") })} />;
  },

  "should call mutateAsync callbacks when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
    setTimeout(() => {
      void mutation.mutateAsync("todo", {
        onSuccess: () => log("mutateAsync.onSuccess"),
        onSettled: () => log("mutateAsync.onSettled"),
      });
    }, 0);
    return <View />;
  },

  "should call mutateAsync error callbacks when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
    }));
    setTimeout(() => {
      mutation
        .mutateAsync("todo", {
          onError: () => log("mutateAsync.onError"),
          onSettled: () => log("mutateAsync.onSettled"),
        })
        .catch(() => {});
    }, 0);
    return <View />;
  },

  "should call only mutateAsync onSuccess when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
    setTimeout(() => {
      void mutation.mutateAsync("todo", { onSuccess: () => log("mutateAsync.onSuccess") });
    }, 0);
    return <View />;
  },

  "should call only mutateAsync onError when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) =>
        sleep(10).then(() => {
          throw new Error("oops");
        }),
    }));
    setTimeout(() => {
      mutation.mutateAsync("todo", { onError: () => log("mutateAsync.onError") }).catch(() => {});
    }, 0);
    return <View />;
  },

  "should call only mutateAsync onSettled when useMutation has no callbacks": () => {
    const mutation = useMutation(() => ({ mutationFn: (text: string) => sleep(10).then(() => text) }));
    setTimeout(() => {
      void mutation.mutateAsync("todo", { onSettled: () => log("mutateAsync.onSettled") });
    }, 0);
    return <View />;
  },

  "should be able to call `onSuccess` and `onSettled` after each successful mutate": () => {
    const count = signal(0);
    const mutation = useMutation(() => ({
      mutationFn: (vars: { count: number }) => Promise.resolve(vars.count),
      onSuccess: (data) => log({ onSuccess: data }),
      onSettled: (data) => log({ onSettled: data }),
    }));
    return (
      <View>
        <Text>{`heading: ${count()}`}</Text>
        <Button
          label="mutate"
          onPress={() => {
            count.set(count() + 1);
            mutation.mutate({ count: count() });
          }}
        />
      </View>
    );
  },

  "should set correct values for `failureReason` and `failureCount` on multiple mutate calls": () => {
    const count = signal(0);
    let calls = 0;
    const mutationFn = (value: { count: number }) => {
      calls++;
      if (calls === 1) return Promise.reject(new Error("Error test"));
      return sleep(10).then(() => value);
    };
    const mutation = useMutation(() => ({ mutationFn }));
    return (
      <View>
        <Text>{mutation.data ? `Data ${mutation.data.count}` : "Data"}</Text>
        <Text>{`Status ${mutation.status}`}</Text>
        <Text>{`Failed ${mutation.failureCount} times`}</Text>
        <Text>{`Failed because ${mutation.failureReason?.message ?? "null"}`}</Text>
        <Button
          label="mutate"
          onPress={() => {
            count.set(count() + 1);
            mutation.mutate({ count: count() });
          }}
        />
      </View>
    );
  },

  "should be able to call `onError` and `onSettled` after each failed mutate": () => {
    const count = signal(0);
    const mutation = useMutation(() => ({
      mutationFn: (vars: { count: number }) => Promise.reject(new Error(`Expected mock error. All is well! ${vars.count}`)),
      onError: (error: Error) => log({ onError: error.message }),
      onSettled: (_data, error) => log({ onSettled: error?.message }),
    }));
    return (
      <View>
        <Text>{`heading: ${count()}`}</Text>
        <Button
          label="mutate"
          onPress={() => {
            count.set(count() + 1);
            mutation.mutate({ count: count() });
          }}
        />
      </View>
    );
  },

  "should be able to override the useMutation success callbacks": () => {
    const mutation = useMutation(() => ({
      mutationFn: (text: string) => Promise.resolve(text),
      onSuccess: () => {
        log("useMutation.onSuccess");
        return Promise.resolve();
      },
      onSettled: () => {
        log("useMutation.onSettled");
        return Promise.resolve();
      },
    }));
    setTimeout(() => {
      void mutation
        .mutateAsync("todo", {
          onSuccess: () => log("mutateAsync.onSuccess"),
          onSettled: () => log("mutateAsync.onSettled"),
        })
        .then((result) => log(`mutateAsync.result:${result}`), () => {});
    }, 10);
    return <View />;
  },

  "should be able to override the error callbacks when using mutateAsync": () => {
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) => Promise.reject(new Error("oops")),
      onError: () => {
        log("useMutation.onError");
        return Promise.resolve();
      },
      onSettled: () => {
        log("useMutation.onSettled");
        return Promise.resolve();
      },
    }));
    setTimeout(() => {
      mutation
        .mutateAsync("todo", {
          onError: () => log("mutateAsync.onError"),
          onSettled: () => log("mutateAsync.onSettled"),
        })
        .catch((error: Error) => log(`mutateAsync.error:${error.message}`));
    }, 10);
    return <View />;
  },

  "should be able to use mutation defaults": ({ queryClient }) => {
    const key = createKey();
    queryClient.setMutationDefaults(key, { mutationFn: (text: string) => sleep(10).then(() => text) });
    const mutation = useMutation<string, unknown, string>(() => ({ mutationKey: key }));
    effect(() => log(snapshot(mutation)));
    setTimeout(() => mutation.mutate("todo"), 10);
    return <View />;
  },

  "should be able to retry a failed mutation": () => {
    let count = 0;
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) => {
        count++;
        log({ count });
        return Promise.reject(new Error("oops"));
      },
      retry: 1,
      retryDelay: 5,
    }));
    setTimeout(() => mutation.mutate("todo"), 10);
    return <View />;
  },

  "should not retry mutations while offline": () => {
    let count = 0;
    const mutation = useMutation(() => ({
      mutationFn: (_text: string) => {
        count++;
        log({ count });
        return Promise.reject(new Error("oops"));
      },
      retry: 1,
      retryDelay: 5,
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>
          {`error: ${mutation.error instanceof Error ? mutation.error.message : "null"}, status: ${mutation.status}, isPaused: ${String(mutation.isPaused)}`}
        </Text>
      </View>
    );
  },

  "should call onMutate even if paused": ({ queryClient }) => {
    let count = 0;
    const mutation = useMutation(() => ({
      mutationFn: async (_text: string) => {
        count++;
        log({ count });
        await sleep(10);
        return count;
      },
      onMutate: (variables: string, context: MutationFunctionContext) => {
        log({ onMutate: [variables, contextOf(context, queryClient)] });
      },
    }));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>{`data: ${mutation.data ?? "null"}, status: ${mutation.status}, isPaused: ${String(mutation.isPaused)}`}</Text>
      </View>
    );
  },

  "should optimistically go to paused state if offline": () => {
    let count = 0;
    const mutation = useMutation(() => ({
      mutationFn: async (_text: string) => {
        count++;
        await sleep(10);
        return count;
      },
    }));
    effect(() => log(`${mutation.status}, ${mutation.isPaused}`));
    return (
      <View>
        <Button label="mutate" onPress={() => mutation.mutate("todo")} />
        <Text>{`data: ${mutation.data ?? "null"}, status: ${mutation.status}, isPaused: ${String(mutation.isPaused)}`}</Text>
      </View>
    );
  },

  "should be able to retry a mutation when online": ({ queryClient }) => {
    const key = createKey();
    let count = 0;
    const mutation = useMutation(() => ({
      mutationKey: key,
      mutationFn: (_text: string) =>
        sleep(1).then(() => {
          count++;
          return count > 1 ? Promise.resolve("data") : Promise.reject(new Error("oops"));
        }),
      retry: 1,
      retryDelay: 5,
      networkMode: "offlineFirst",
    }));
    effect(() => log(snapshot(mutation)));
    setTimeout(() => mutation.mutate("todo"), 10);
    return (
      <Button
        label="inspect"
        onPress={() => {
          const found = queryClient.getMutationCache().findAll({ mutationKey: key });
          const state = found[0]?.state;
          log({
            cached: found.length,
            state: state && {
              status: state.status,
              isPaused: state.isPaused,
              failureCount: state.failureCount,
              failureReason: state.failureReason,
              data: state.data,
            },
          });
        }}
      />
    );
  },

  "should not change state if unmounted": ({ queryClient }) => {
    function Mutates() {
      const mutation = useMutation(() => ({ mutationFn: () => sleep(10) }));
      effect(() => log(mutation.status));
      return <Button label="mutate" onPress={() => mutation.mutate()} />;
    }
    const mounted = signal(true);
    return (
      <View>
        <Button label="unmount" onPress={() => mounted.set(false)} />
        <Button label="inspect" onPress={() => log({ cacheStatus: queryClient.getMutationCache().getAll()[0]?.state.status })} />
        <If when={mounted()}>
          <Mutates />
        </If>
      </View>
    );
  },
};

runScenarios(scenarios);
