// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a search field with its placeholder and forwards input props", () => {
    const onChange = vi.fn();
    render(
      <SearchInput
        placeholder='Search songs'
        aria-label='Search songs'
        value=''
        onChange={onChange}
      />
    );

    const field = screen.getByPlaceholderText("Search songs");
    expect(field.getAttribute("type")).toBe("search");
    expect(screen.getByRole("searchbox", { name: "Search songs" })).toBe(field);

    fireEvent.change(field, { target: { value: "riff" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("forwards the ref to the input", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchInput ref={ref} defaultValue='' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("shows no clear button while the value is empty", () => {
    render(
      <SearchInput
        value=''
        onChange={() => undefined}
        onClear={() => undefined}
        clearLabel='Clear search'
      />
    );
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("shows a clear button with a value and calls onClear", () => {
    const onClear = vi.fn();
    render(
      <SearchInput
        value='metallica'
        onChange={() => undefined}
        onClear={onClear}
        clearLabel='Clear search'
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("shows no clear button without onClear", () => {
    render(<SearchInput value='metallica' onChange={() => undefined} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
