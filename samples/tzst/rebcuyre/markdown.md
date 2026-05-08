# Advanced Markdown Sample

Comprehensive syntax showcase for **Dusk Office** theme testing.

## Text Formatting

**Bold text** and *italic text* and ***bold italic*** combined.

~~Strikethrough~~ and `inline code` and ==highlighted text==.

Superscript: X^2^ and subscript: H~2~O.

[Links](https://example.com "Optional title") and [reference links][ref].

[ref]: https://example.com "Reference link"

Auto-link: <https://example.com> and email: <user@example.com>

## Code Blocks

```typescript
interface Config {
  host: string;
  port: number;
  ssl?: boolean;
}

const config: Config = {
  host: "localhost",
  port: 8080,
  ssl: true,
};

export default config;
```

```python
from dataclasses import dataclass

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    ssl: bool = False
```

```rust
struct Config {
    host: String,
    port: u16,
    ssl: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "localhost".into(),
            port: 8080,
            ssl: false,
        }
    }
}
```

## Blockquotes

> Simple blockquote.
>
> Multiple paragraphs.

> Nested blockquotes:
>
> > Deeper level.
> >
> > With code:
> >
> > ```js
> > console.log("nested");
> > ```

> **Note:** This is a callout-style quote.
> 
> It can contain multiple lines and **formatting**.

## Lists

### Unordered

- First item
- Second item
  - Nested item
    - Deeper nested
  - Another nested
- Third item

* Alternative syntax
+ Another alternative

### Ordered

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another done
- [ ] Todo item

### Definition Lists

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Second definition

## Tables

| Feature | Status | Notes |
|---------|:------:|-------|
| Syntax highlighting | ✅ | All languages |
| Dark mode | ✅ | Multiple variants |
| Auto-switch | ✅ | By hour |
| Status bar | ✅ | Quick access |
| Control Center | ✅ | Command palette |

| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
| D    | E      | F     |

## Footnotes

Here is a footnote reference[^1], and another[^long].

[^1]: This is the first footnote.
[^long]: This is a longer footnote with multiple paragraphs.

    It can contain code blocks too:

    ```js
    console.log("footnote code");
    ```

## Images

![Alt text](https://via.placeholder.com/150 "Optional title")

| Image | Description |
|-------|-------------|
| ![Small](https://via.placeholder.com/50) | Thumbnail |
| ![Medium](https://via.placeholder.com/100) | Preview |

## Horizontal Rules

Three or more:

---

Hyphens

***

Asterisks

___

Underscores

## Headings

# H1

## H2

### H3

#### H4

##### H5

###### H6

Alternative H1
==============

Alternative H2
--------------

## HTML Elements

<div class="custom-block">
  <p>HTML paragraph inside div.</p>
  <ul>
    <li>HTML list item</li>
    <li>Another item</li>
  </ul>
</div>

<details>
<summary>Click to expand</summary>

Hidden content revealed!

- Item 1
- Item 2

</details>

## Math (LaTeX)

Inline math: $E = mc^2$ and $a^2 + b^2 = c^2$.

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

Matrix:

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
$$

## Abbreviations

*[HTML]: Hyper Text Markup Language
*[CSS]: Cascading Style Sheets

HTML and CSS are web technologies.

## Special Characters

Copyright © • Registered ® • Trademark ™

Arrows: → ← ↑ ↓ ↔ ↕ ⇒ ⇐ ⇑ ⇓

Math: ± × ÷ ≠ ≈ ≤ ≥ ∞ ∑ ∏ √

Currency: € £ ¥ $ ¢

## Admonitions

::: note
This is a note admonition.
:::

::: warning
This is a warning.
:::

::: tip
This is a helpful tip.
:::

::: danger
This is a danger warning.
:::

## Summary

This document tests:
- Text formatting
- Code blocks with syntax highlighting
- Tables and alignment
- Lists (ordered, unordered, task, definition)
- Blockquotes and nesting
- Footnotes
- Math equations
- HTML embedding
- Admonitions
