import { type esbuild } from "./deps.ts";
import {
  denoPlugins,
  denoResolverPlugin,
  esbuildResolutionToURL,
} from "./mod.ts";
import { denoLoaderPlugin } from "./src/plugin_deno_loader.ts";
import { esbuildNative, esbuildWasm, join } from "./test_deps.ts";
import { assert, assertEquals } from "./test_deps.ts";

const LOADERS = ["native", "portable"] as const;
const PLATFORMS = { "native": esbuildNative, "wasm": esbuildWasm };

const DEFAULT_OPTS = {
  write: false,
  format: "esm",
  // TODO(lucacasonato): remove when https://github.com/evanw/esbuild/pull/2968 is fixed
  absWorkingDir: Deno.cwd(),
} as const;

function test(
  name: string,
  loaders: readonly ("native" | "portable")[],
  fn: (
    esbuild: typeof esbuildNative,
    loader: "native" | "portable",
  ) => Promise<void>,
) {
  for (const [platform, esbuild] of Object.entries(PLATFORMS)) {
    for (const loader of loaders) {
      Deno.test({
        name: `[${loader}, ${platform}] ${name}`,
        ignore: platform === "wasm" && Deno.build.os === "windows",
        fn: async () => {
          try {
            await esbuild.initialize({});
            await fn(esbuild, loader);
          } finally {
            esbuild.stop();
          }
          // Let esbuild cleanup finish closing resources and cancelling async
          // tasks. This should take just 1 event loop tick.
          await new Promise((r) => setTimeout(r, 5));
        },
      });
    }
  }
}

test("remote ts", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["https://deno.land/std@0.173.0/collections/without_all.ts"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { withoutAll } = await import(dataURL);
  assertEquals(withoutAll([1, 2, 3], [2, 3, 4]), [1]);
});

test("local ts", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.ts"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

test("remote mts", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: [
      "https://gist.githubusercontent.com/lucacasonato/4ad57db57ee8d44e4ec08d6a912e93a7/raw/f33e698b4445a7243d72dbfe95afe2d004c7ffc6/mod.mts",
    ],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

test("local mts", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.mts"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

test("remote js", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["https://crux.land/266TSp"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd");
});

test("local js", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.js"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd");
});

test("remote mjs", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: [
      "https://gist.githubusercontent.com/lucacasonato/4ad57db57ee8d44e4ec08d6a912e93a7/raw/f33e698b4445a7243d72dbfe95afe2d004c7ffc6/mod.mjs",
    ],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd");
});

test("local mjs", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.mjs"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd");
});

test("remote jsx", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["https://crux.land/GeaWJ"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const m = await import(dataURL);
  assertEquals(m.default, "foo");
});

test("local jsx", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.jsx"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const m = await import(dataURL);
  assertEquals(m.default, "foo");
});

test("remote tsx", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["https://crux.land/2Qjyo7"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const m = await import(dataURL);
  assertEquals(m.default, "foo");
});

test("local tsx", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/mod.tsx"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const m = await import(dataURL);
  assertEquals(m.default, "foo");
});

test("bundle remote imports", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    bundle: true,
    platform: "neutral",
    entryPoints: ["https://deno.land/std@0.173.0/uuid/mod.ts"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { v1 } = await import(dataURL);
  assert(v1.validate(v1.generate()));
});

test("local json", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    entryPoints: ["./testdata/data.json"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { default: data } = await import(dataURL);
  assertEquals(data, {
    "hello": "world",
    ["__proto__"]: {
      "sky": "universe",
    },
  });
});

test("npm specifiers - preact", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    plugins: [...denoPlugins({ loader })],
    write: false,
    format: "esm",
    bundle: true,
    entryPoints: ["./testdata/npm/preact.tsx"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  assert(!output.text.includes(`npm:`));
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { default: html } = await import(dataURL);
  assertEquals(html, "<div>hello world</div>");
});

test("npm specifiers - react", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    plugins: [...denoPlugins({ loader })],
    write: false,
    format: "esm",
    bundle: true,
    entryPoints: ["./testdata/npm/react.tsx"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  assert(!output.text.includes(`npm:`));
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { default: html } = await import(dataURL);
  assertEquals(html, "<div>hello world</div>");
});

test("remote http redirects are de-duped", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [...denoPlugins({ loader })],
    bundle: true,
    entryPoints: ["./testdata/remote_redirects.js"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const matches = [...output.text.matchAll(/0\.178\.0/g)];
  assertEquals(matches.length, 2); // once in the comment, once in the code
});

const importMapURL =
  new URL("./testdata/import_map.json", import.meta.url).href;

test("bundle explicit import map", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [
      ...denoPlugins({ importMapURL, loader }),
    ],
    bundle: true,
    platform: "neutral",
    entryPoints: ["./testdata/mapped.js"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

test("bundle config inline import map", LOADERS, async (esbuild, loader) => {
  const configPath = join(Deno.cwd(), "testdata", "config_inline.jsonc");
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [
      ...denoPlugins({ configPath, loader }),
    ],
    bundle: true,
    platform: "neutral",
    entryPoints: ["./testdata/mapped.js"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

test("bundle config ref import map", LOADERS, async (esbuild, loader) => {
  const configPath = join(Deno.cwd(), "testdata", "config_ref.json");
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [
      ...denoPlugins({ configPath, loader }),
    ],
    bundle: true,
    platform: "neutral",
    entryPoints: ["./testdata/mapped.js"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { bool } = await import(dataURL);
  assertEquals(bool, "asd2");
});

const COMPUTED_PLUGIN: esbuild.Plugin = {
  name: "computed",
  setup(build) {
    build.onResolve({ filter: /.*/, namespace: "computed" }, (args) => {
      return { path: args.path, namespace: "computed" };
    });
    build.onLoad({ filter: /.*/, namespace: "computed" }, (args) => {
      const url = esbuildResolutionToURL(args);
      return { contents: `export default ${url.pathname};`, loader: "js" };
    });
  },
};

test("custom plugin for scheme", LOADERS, async (esbuild, loader) => {
  const res = await esbuild.build({
    ...DEFAULT_OPTS,
    plugins: [
      denoResolverPlugin(),
      COMPUTED_PLUGIN,
      denoLoaderPlugin({ loader }),
    ],
    entryPoints: ["computed:1+2"],
  });
  assertEquals(res.warnings, []);
  assertEquals(res.errors, []);
  assertEquals(res.outputFiles.length, 1);
  const output = res.outputFiles[0];
  assertEquals(output.path, "<stdout>");
  const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
  const { default: sum } = await import(dataURL);
  assertEquals(sum, 3);
});

test(
  "custom plugin for scheme with import map",
  LOADERS,
  async (esbuild, loader) => {
    const res = await esbuild.build({
      ...DEFAULT_OPTS,
      plugins: [
        denoResolverPlugin({ importMapURL }),
        COMPUTED_PLUGIN,
        denoLoaderPlugin({ importMapURL, loader }),
      ],
      bundle: true,
      entryPoints: ["./testdata/mapped-computed.js"],
    });
    assertEquals(res.warnings, []);
    assertEquals(res.errors, []);
    assertEquals(res.outputFiles.length, 1);
    const output = res.outputFiles[0];
    assertEquals(output.path, "<stdout>");
    const dataURL = `data:application/javascript;base64,${btoa(output.text)}`;
    const { default: sum } = await import(dataURL);
    assertEquals(sum, 3);
  },
);
