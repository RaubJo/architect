import { afterEach, describe, expect, test } from "bun:test";
import { Str, registerGlobalStr, strTestingHelpers } from "@/support/str";

describe("Str helper", () => {
    const originalGlobalStr = (globalThis as { Str?: unknown }).Str;

    afterEach(() => {
        (globalThis as { Str?: unknown }).Str = originalGlobalStr;
    });

    // ── Original tests ────────────────────────────────────────────────────────

    test("changes string case and length", () => {
        expect(Str.lower("TeSt")).toBe("test");
        expect(Str.upper("TeSt")).toBe("TEST");
        expect(Str.length("abc")).toBe(3);
    });

    test("checks contains and boundaries", () => {
        expect(Str.contains("Hello World", "World")).toBe(true);
        expect(Str.contains("Hello World", "world")).toBe(false);
        expect(Str.contains("Hello World", "world", true)).toBe(true);
        expect(Str.contains("Hello World", ["x", "y"])).toBe(false);

        expect(Str.startsWith("framework", "frame")).toBe(true);
        expect(Str.startsWith("framework", ["zzz", "fra"])).toBe(true);
        expect(Str.startsWith("framework", "zzz")).toBe(false);

        expect(Str.endsWith("framework", "work")).toBe(true);
        expect(Str.endsWith("framework", ["abc", "work"])).toBe(true);
        expect(Str.endsWith("framework", "abc")).toBe(false);
    });

    test("replaces content", () => {
        expect(Str.replace("laravel", "ioc", "laravel-app")).toBe("ioc-app");
        expect(Str.replace(/-app$/, "", "laravel-app")).toBe("laravel");
    });

    test("converts string casing styles", () => {
        expect(Str.snake("HelloWorld")).toBe("hello_world");
        expect(Str.snake("hello-world", ".")).toBe("hello.world");
        expect(Str.kebab("HelloWorld")).toBe("hello-world");
        expect(Str.studly("hello_world-test")).toBe("HelloWorldTest");
        expect(Str.camel("hello_world-test")).toBe("helloWorldTest");
        expect(Str.camel("")).toBe("");
    });

    test("creates slugs", () => {
        expect(Str.slug("Héllo, Wörld!")).toBe("hello-world");
        expect(Str.slug("Héllo, Wörld!", "_")).toBe("hello_world");
    });

    test("registers global Str without overriding existing value", () => {
        (globalThis as { Str?: unknown }).Str = undefined;
        registerGlobalStr();
        expect((globalThis as { Str?: unknown }).Str).toBe(Str);

        const custom = { custom: true };
        (globalThis as { Str?: unknown }).Str = custom;
        registerGlobalStr();
        expect((globalThis as { Str?: unknown }).Str).toBe(custom);
    });

    test("exposes helper internals", () => {
        expect(strTestingHelpers.splitWords("HelloWorld_test-value")).toEqual([
            "Hello",
            "World",
            "test",
            "value",
        ]);
        expect(strTestingHelpers.splitWords("")).toEqual([]);
        expect(strTestingHelpers.normalizeForSlug("Héllo Wörld")).toBe("hello-world");
    });

    // ── after / afterLast ─────────────────────────────────────────────────────

    test("after returns everything after first occurrence", () => {
        expect(Str.after("This is my name", "This is")).toBe(" my name");
        expect(Str.after("This is my name", "xyz")).toBe("This is my name");
        expect(Str.after("This is my name", "")).toBe("This is my name");
    });

    test("afterLast returns everything after last occurrence", () => {
        expect(Str.afterLast("App\\Http\\Controllers\\Controller", "\\")).toBe("Controller");
        expect(Str.afterLast("no-match", "xyz")).toBe("no-match");
        expect(Str.afterLast("", "")).toBe("");
    });

    // ── apa ───────────────────────────────────────────────────────────────────

    test("apa title-cases major words and lowercases minor ones", () => {
        expect(Str.apa("an analysis of the role of the federal government")).toBe(
            "An Analysis of the Role of the Federal Government",
        );
        expect(Str.apa("to be or not to be")).toBe("To Be or Not to Be");
        // first and last word are always capitalised
        expect(Str.apa("the end of the")).toBe("The End of The");
    });

    // ── before / beforeLast ───────────────────────────────────────────────────

    test("before returns everything before first occurrence", () => {
        expect(Str.before("This is my name", "my name")).toBe("This is ");
        expect(Str.before("This is my name", "xyz")).toBe("This is my name");
        expect(Str.before("This is my name", "")).toBe("This is my name");
    });

    test("beforeLast returns everything before last occurrence", () => {
        expect(Str.beforeLast("This is my name", "is")).toBe("This ");
        expect(Str.beforeLast("This is my name", "xyz")).toBe("This is my name");
    });

    // ── between / betweenFirst ────────────────────────────────────────────────

    test("between extracts substring from first to last delimiter", () => {
        expect(Str.between("This is my name", "This", "name")).toBe(" is my ");
        expect(Str.between("[a] bc [d]", "[", "]")).toBe("a] bc [d");
    });

    test("betweenFirst extracts substring between first pair of delimiters", () => {
        expect(Str.betweenFirst("[a] bc [d]", "[", "]")).toBe("a");
        expect(Str.betweenFirst("no delimiters", "[", "]")).toBe("no delimiters");
    });

    // ── charAt ────────────────────────────────────────────────────────────────

    test("charAt returns the character at the given index or false", () => {
        expect(Str.charAt("hello", 1)).toBe("e");
        expect(Str.charAt("hello", 10)).toBe(false);
        expect(Str.charAt("hello", 0)).toBe("h");
    });

    // ── chopStart / chopEnd ───────────────────────────────────────────────────

    test("chopStart removes a matching prefix", () => {
        expect(Str.chopStart("https://example.com", "https://")).toBe("example.com");
        expect(Str.chopStart("https://example.com", ["http://", "https://"])).toBe("example.com");
        expect(Str.chopStart("no-match", "xyz")).toBe("no-match");
    });

    test("chopEnd removes a matching suffix", () => {
        expect(Str.chopEnd("Hello World", " World")).toBe("Hello");
        expect(Str.chopEnd("Hello World", [" Universe", " World"])).toBe("Hello");
        expect(Str.chopEnd("no-match", "xyz")).toBe("no-match");
    });

    // ── containsAll ───────────────────────────────────────────────────────────

    test("containsAll checks all needles are present", () => {
        expect(Str.containsAll("Hello World", ["Hello", "World"])).toBe(true);
        expect(Str.containsAll("Hello World", ["Hello", "xyz"])).toBe(false);
        expect(Str.containsAll("Hello World", ["hello", "world"], true)).toBe(true);
    });

    // ── deduplicate ───────────────────────────────────────────────────────────

    test("deduplicate collapses consecutive repeated chars", () => {
        expect(Str.deduplicate("hello   world")).toBe("hello world");
        expect(Str.deduplicate("aabbcc", "a")).toBe("abbcc");
        expect(Str.deduplicate("hello/world//path", "/")).toBe("hello/world/path");
    });

    // ── doesntContain / doesntStartWith / doesntEndWith ───────────────────────

    test("doesntContain is the inverse of contains", () => {
        expect(Str.doesntContain("Hello", "xyz")).toBe(true);
        expect(Str.doesntContain("Hello", "Hello")).toBe(false);
        expect(Str.doesntContain("Hello", ["x", "y"])).toBe(true);
    });

    test("doesntStartWith is the inverse of startsWith", () => {
        expect(Str.doesntStartWith("framework", "zzz")).toBe(true);
        expect(Str.doesntStartWith("framework", "fra")).toBe(false);
    });

    test("doesntEndWith is the inverse of endsWith", () => {
        expect(Str.doesntEndWith("framework", "abc")).toBe(true);
        expect(Str.doesntEndWith("framework", "work")).toBe(false);
    });

    // ── excerpt ───────────────────────────────────────────────────────────────

    test("excerpt extracts text around a phrase", () => {
        expect(Str.excerpt("This is my name", "my", { radius: 3 })).toBe("...is my na...");
        expect(Str.excerpt("This is my name", "my", { radius: 3, omission: "…" })).toBe("…is my na…");
        expect(Str.excerpt("This is my name", "not-found")).toBe("This is my name");
        // at start — no leading omission
        expect(Str.excerpt("This is my name", "This", { radius: 2 })).toBe("This i...");
    });

    // ── finish ────────────────────────────────────────────────────────────────

    test("finish ensures the string ends with the cap", () => {
        expect(Str.finish("this/string", "/")).toBe("this/string/");
        expect(Str.finish("this/string/", "/")).toBe("this/string/");
    });

    // ── fromBase64 / toBase64 ─────────────────────────────────────────────────

    test("base64 round-trip", () => {
        const encoded = Str.toBase64("Hello World");
        expect(encoded).toBe("SGVsbG8gV29ybGQ=");
        expect(Str.fromBase64(encoded)).toBe("Hello World");
    });

    // ── headline ─────────────────────────────────────────────────────────────

    test("headline formats a string as title words", () => {
        expect(Str.headline("steve_jobs")).toBe("Steve Jobs");
        expect(Str.headline("EmailNotificationSent")).toBe("Email Notification Sent");
        expect(Str.headline("hello-world-test")).toBe("Hello World Test");
    });

    // ── initials ─────────────────────────────────────────────────────────────

    test("initials extracts the first letter of each word", () => {
        expect(Str.initials("taylor otwell")).toBe("to");
        expect(Str.initials("taylor otwell", true)).toBe("TO");
        expect(Str.initials("Single")).toBe("s");
    });

    // ── is ────────────────────────────────────────────────────────────────────

    test("is matches glob patterns", () => {
        expect(Str.is("App\\*", "App\\Http\\Controllers\\Controller")).toBe(true);
        expect(Str.is("*.jpg", "photo.jpg")).toBe(true);
        expect(Str.is("*.jpg", "photo.png")).toBe(false);
        expect(Str.is("foo", "foo")).toBe(true);
        expect(Str.is("FOO", "foo", true)).toBe(true);
    });

    // ── isAscii ───────────────────────────────────────────────────────────────

    test("isAscii detects ASCII-only strings", () => {
        expect(Str.isAscii("Hello World")).toBe(true);
        expect(Str.isAscii("Héllo")).toBe(false);
    });

    // ── isJson ────────────────────────────────────────────────────────────────

    test("isJson validates JSON strings", () => {
        expect(Str.isJson('{"key":"value"}')).toBe(true);
        expect(Str.isJson("[1,2,3]")).toBe(true);
        expect(Str.isJson("not json")).toBe(false);
    });

    // ── isUrl ─────────────────────────────────────────────────────────────────

    test("isUrl validates URLs", () => {
        expect(Str.isUrl("https://example.com")).toBe(true);
        expect(Str.isUrl("not-a-url")).toBe(false);
        expect(Str.isUrl("https://example.com", ["https"])).toBe(true);
        expect(Str.isUrl("ftp://example.com", ["https"])).toBe(false);
    });

    // ── isUlid ────────────────────────────────────────────────────────────────

    test("isUlid validates ULID strings", () => {
        expect(Str.isUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(true);
        expect(Str.isUlid("not-a-ulid")).toBe(false);
        expect(Str.isUlid("01ARZ3NDEKTSV4RRFFQ69G5FA")).toBe(false); // 25 chars
    });

    // ── isUuid ────────────────────────────────────────────────────────────────

    test("isUuid validates UUID strings", () => {
        const v4uuid = "550e8400-e29b-41d4-a716-446655440000";
        expect(Str.isUuid(v4uuid)).toBe(true);
        expect(Str.isUuid("not-a-uuid")).toBe(false);
        // '41d4' — the version digit is '4', so this IS a v4 UUID
        expect(Str.isUuid(v4uuid, 4)).toBe(true);
        expect(Str.isUuid(v4uuid, 1)).toBe(false);
        // v1 example
        expect(Str.isUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8", 1)).toBe(true);
    });

    // ── isMatch ───────────────────────────────────────────────────────────────

    test("isMatch tests a regex against a value", () => {
        expect(Str.isMatch(/^\d+$/, "12345")).toBe(true);
        expect(Str.isMatch("^\\d+$", "12345")).toBe(true);
        expect(Str.isMatch(/^\d+$/, "abc")).toBe(false);
    });

    // ── lcfirst / ucfirst ─────────────────────────────────────────────────────

    test("lcfirst lowercases the first character", () => {
        expect(Str.lcfirst("Hello World")).toBe("hello World");
        expect(Str.lcfirst("")).toBe("");
    });

    test("ucfirst uppercases the first character", () => {
        expect(Str.ucfirst("hello world")).toBe("Hello world");
        expect(Str.ucfirst("")).toBe("");
    });

    // ── limit ─────────────────────────────────────────────────────────────────

    test("limit truncates to a character count", () => {
        expect(Str.limit("The quick brown fox jumped over the lazy dog", 20)).toBe(
            "The quick brown fox ...",
        );
        expect(Str.limit("Short", 100)).toBe("Short");
        expect(Str.limit("The quick brown fox", 15, "...", true)).toBe("The quick...");
    });

    // ── mask ──────────────────────────────────────────────────────────────────

    test("mask replaces characters with a mask char", () => {
        // "taylor@example.com" length=18; masking from index 3 → 15 stars
        expect(Str.mask("taylor@example.com", "*", 3)).toBe("tay***************");
        // masking 4 chars from index 3: indices 3,4,5,6 = l,o,r,@ → "tay****example.com"
        expect(Str.mask("taylor@example.com", "*", 3, 4)).toBe("tay****example.com");
        // negative index: -3 means last 3 chars = "com"
        expect(Str.mask("taylor@example.com", "*", -3)).toBe("taylor@example.***");
    });

    // ── match / matchAll ──────────────────────────────────────────────────────

    test("match returns first capture group or full match", () => {
        expect(Str.match("/bar/", "foo bar")).toBe("bar");
        expect(Str.match("/(bar)/", "foo bar")).toBe("bar");
        expect(Str.match("/xyz/", "foo bar")).toBe("");
    });

    test("matchAll returns all matches", () => {
        expect(Str.matchAll("/a/", "banana")).toEqual(["a", "a", "a"]);
        expect(Str.matchAll("/(a)/", "banana")).toEqual(["a", "a", "a"]);
        expect(Str.matchAll("/z/", "banana")).toEqual([]);
    });

    // ── padBoth / padLeft / padRight ──────────────────────────────────────────

    test("pad functions pad strings to a given length", () => {
        expect(Str.padLeft("5", 3, "0")).toBe("005");
        expect(Str.padRight("Hello", 10, "-")).toBe("Hello-----");
        expect(Str.padBoth("X", 5, "-")).toBe("--X--");
        expect(Str.padBoth("X", 6, "-")).toBe("--X---");
        expect(Str.padBoth("already-long", 3, "-")).toBe("already-long");
    });

    // ── position ─────────────────────────────────────────────────────────────

    test("position returns index or false", () => {
        expect(Str.position("Hello World", "World")).toBe(6);
        expect(Str.position("Hello World", "xyz")).toBe(false);
        expect(Str.position("aababc", "ab", 2)).toBe(3);
    });

    // ── random ───────────────────────────────────────────────────────────────

    test("random generates an alphanumeric string of the given length", () => {
        const r = Str.random(32);
        expect(r).toHaveLength(32);
        expect(/^[A-Za-z0-9]+$/.test(r)).toBe(true);
        // default length
        expect(Str.random()).toHaveLength(16);
        // two calls should not be equal (astronomically unlikely)
        expect(Str.random(32)).not.toBe(Str.random(32));
    });

    // ── remove ───────────────────────────────────────────────────────────────

    test("remove deletes occurrences of a search string", () => {
        // "Peter Piper Picked Peppers" → remove all 'e': Ptr Pipr Pickd Ppprs
        expect(Str.remove("e", "Peter Piper Picked Peppers")).toBe("Ptr Pipr Pickd Ppprs");
        expect(Str.remove("E", "Peter Piper Picked Peppers", false)).toBe(
            "Ptr Pipr Pickd Ppprs",
        );
        // remove 'e' first → "Ptr Pipr", then remove 'P' → "tr ipr"
        expect(Str.remove(["e", "P"], "Peter Piper")).toBe("tr ipr");
    });

    // ── repeat ───────────────────────────────────────────────────────────────

    test("repeat repeats a string n times", () => {
        expect(Str.repeat("ab", 3)).toBe("ababab");
        expect(Str.repeat("x", 0)).toBe("");
    });

    // ── replaceArray ─────────────────────────────────────────────────────────

    test("replaceArray replaces occurrences sequentially", () => {
        // replaces each '?' in order with the next array element
        expect(Str.replaceArray("?", ["8", "30"], "The event will take place between ? and ?")).toBe(
            "The event will take place between 8 and 30",
        );
        // more replacements than occurrences: extra array elements ignored
        expect(Str.replaceArray("?", ["a", "b", "c"], "? and ?")).toBe("a and b");
    });

    // ── replaceFirst / replaceLast ────────────────────────────────────────────

    test("replaceFirst replaces only the first occurrence", () => {
        expect(Str.replaceFirst("a", "b", "aabaa")).toBe("babaa");
        expect(Str.replaceFirst("x", "y", "hello")).toBe("hello");
    });

    test("replaceLast replaces only the last occurrence", () => {
        expect(Str.replaceLast("a", "b", "aabaa")).toBe("aabab");
        expect(Str.replaceLast("x", "y", "hello")).toBe("hello");
    });

    // ── replaceMatches ────────────────────────────────────────────────────────

    test("replaceMatches replaces using a pattern and string or callback", () => {
        expect(Str.replaceMatches("/[^A-Za-z0-9]+/", "", "Hello, World! 123")).toBe(
            "HelloWorld123",
        );
        expect(
            Str.replaceMatches(/(\d+)/, (m) => String(Number(m[1]) * 2), "1 and 2 and 3"),
        ).toBe("2 and 4 and 6");
    });

    // ── replaceStart / replaceEnd ─────────────────────────────────────────────

    test("replaceStart only replaces if at the start", () => {
        expect(Str.replaceStart("Hello", "Hi", "Hello World")).toBe("Hi World");
        expect(Str.replaceStart("Hello", "Hi", "World Hello")).toBe("World Hello");
    });

    test("replaceEnd only replaces if at the end", () => {
        expect(Str.replaceEnd("World", "Earth", "Hello World")).toBe("Hello Earth");
        expect(Str.replaceEnd("World", "Earth", "World Hello")).toBe("World Hello");
    });

    // ── reverse ───────────────────────────────────────────────────────────────

    test("reverse reverses a string", () => {
        expect(Str.reverse("Hello")).toBe("olleH");
        expect(Str.reverse("")).toBe("");
    });

    // ── squish ────────────────────────────────────────────────────────────────

    test("squish collapses whitespace", () => {
        expect(Str.squish("    laravel    framework    ")).toBe("laravel framework");
        expect(Str.squish("  a  b   c  ")).toBe("a b c");
    });

    // ── start ─────────────────────────────────────────────────────────────────

    test("start ensures the string begins with the prefix", () => {
        expect(Str.start("this/string", "/")).toBe("/this/string");
        expect(Str.start("/this/string", "/")).toBe("/this/string");
    });

    // ── substr ────────────────────────────────────────────────────────────────

    test("substr slices a string", () => {
        expect(Str.substr("Hello World", 6)).toBe("World");
        expect(Str.substr("Hello World", 0, 5)).toBe("Hello");
        expect(Str.substr("Hello World", -5)).toBe("World");
    });

    // ── substrCount ───────────────────────────────────────────────────────────

    test("substrCount counts needle occurrences", () => {
        expect(Str.substrCount("If you like ice cream, you will like it", "like")).toBe(2);
        expect(Str.substrCount("aaaa", "aa")).toBe(2);
        expect(Str.substrCount("hello", "")).toBe(0);
    });

    // ── substrReplace ─────────────────────────────────────────────────────────

    test("substrReplace replaces a portion of the string", () => {
        expect(Str.substrReplace("Hello World", "Laravel", 6)).toBe("Hello Laravel");
        // insert at index 5 (between 'o' and ' '), length 0 = insert without removing
        expect(Str.substrReplace("Hello World", " there", 5, 0)).toBe("Hello there World");
        expect(Str.substrReplace("Hello World", "X", 0, 5)).toBe("X World");
    });

    // ── swap ─────────────────────────────────────────────────────────────────

    test("swap replaces keys with values (longest key first)", () => {
        expect(Str.swap({ Tacos: "Burritos", great: "fantastic" }, "Tacos are great!")).toBe(
            "Burritos are fantastic!",
        );
    });

    // ── take ─────────────────────────────────────────────────────────────────

    test("take returns chars from start (positive) or end (negative)", () => {
        expect(Str.take("Build something great!", 5)).toBe("Build");
        expect(Str.take("Build something great!", -6)).toBe("great!");
    });

    // ── title ─────────────────────────────────────────────────────────────────

    test("title converts to title case", () => {
        expect(Str.title("a nice title")).toBe("A Nice Title");
    });

    // ── trim / ltrim / rtrim ──────────────────────────────────────────────────

    test("trim removes whitespace or given chars", () => {
        expect(Str.trim("  hello  ")).toBe("hello");
        expect(Str.trim("/hello/", "/")).toBe("hello");
        expect(Str.ltrim("  hello  ")).toBe("hello  ");
        expect(Str.ltrim("---hello---", "-")).toBe("hello---");
        expect(Str.rtrim("  hello  ")).toBe("  hello");
        expect(Str.rtrim("---hello---", "-")).toBe("---hello");
    });

    // ── ucsplit ───────────────────────────────────────────────────────────────

    test("ucsplit splits on uppercase letter boundaries", () => {
        expect(Str.ucsplit("FooBar")).toEqual(["Foo", "Bar"]);
        expect(Str.ucsplit("HelloWorldTest")).toEqual(["Hello", "World", "Test"]);
    });

    // ── ucwords ───────────────────────────────────────────────────────────────

    test("ucwords uppercases the first letter of each word", () => {
        expect(Str.ucwords("hello world")).toBe("Hello World");
        expect(Str.ucwords("foo bar baz")).toBe("Foo Bar Baz");
    });

    // ── unwrap ────────────────────────────────────────────────────────────────

    test("unwrap removes surrounding delimiters", () => {
        expect(Str.unwrap('"value"', '"')).toBe("value");
        expect(Str.unwrap("<value>", "<", ">")).toBe("value");
        expect(Str.unwrap("value", '"')).toBe("value");
    });

    // ── wordCount ─────────────────────────────────────────────────────────────

    test("wordCount counts whitespace-separated words", () => {
        expect(Str.wordCount("Hello, World!")).toBe(2);
        expect(Str.wordCount("  ")).toBe(0);
        expect(Str.wordCount("one")).toBe(1);
    });

    // ── wordWrap ─────────────────────────────────────────────────────────────

    test("wordWrap wraps long lines at word boundaries", () => {
        expect(Str.wordWrap("The quick brown fox jumped over the lazy dog", 15)).toBe(
            "The quick brown\nfox jumped over\nthe lazy dog",
        );
        expect(Str.wordWrap("Short", 10)).toBe("Short");
        expect(Str.wordWrap("The quick brown fox", 15, "<br>")).toBe(
            "The quick brown<br>fox",
        );
    });

    // ── words ─────────────────────────────────────────────────────────────────

    test("words limits to a number of words", () => {
        expect(Str.words("Perfectly balanced, as all things should be.", 3)).toBe(
            "Perfectly balanced, as...",
        );
        expect(Str.words("Perfectly balanced", 5)).toBe("Perfectly balanced");
        expect(Str.words("One two three", 2, " (more)")).toBe("One two (more)");
    });

    // ── wrap ─────────────────────────────────────────────────────────────────

    test("wrap surrounds the value with delimiters", () => {
        expect(Str.wrap("value", '"')).toBe('"value"');
        expect(Str.wrap("value", "<", ">")).toBe("<value>");
    });

    test("random falls back to Math.random when crypto.getRandomValues is unavailable", () => {
        const origCrypto = globalThis.crypto;
        (globalThis as { crypto?: unknown }).crypto = {};
        try {
            const r = Str.random(16);
            expect(r).toHaveLength(16);
        } finally {
            (globalThis as { crypto?: unknown }).crypto = origCrypto;
        }
    });

    test("wordWrap cuts long words when cutLongWords is true", () => {
        const result = Str.wordWrap("superlongword", 5, "\n", true);
        expect(result).toBe("super\nlongw\nord");
    });

    test("wordWrap cuts long word mid-string when cutLongWords is true", () => {
        const result = Str.wordWrap("hi superlongword there", 5, "\n", true);
        expect(result.split("\n")).toContain("super");
        expect(result.split("\n")).toContain("hi");
    });
});
