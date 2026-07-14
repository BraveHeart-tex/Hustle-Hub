import { type Extensions } from '@tiptap/core';
import { Placeholder, type PlaceholderOptions } from '@tiptap/extensions';
import StarterKit, { type StarterKitOptions } from '@tiptap/starter-kit';

interface CreateEditorExtensionsOptions {
  starterKit?: Partial<StarterKitOptions>;
  placeholder?: PlaceholderOptions['placeholder'];
  extensions?: Extensions;
}

/**
 * Builds the common extension foundation used by the app's Tiptap editors.
 * Editor-specific behavior belongs in `extensions`; editor-specific rendering
 * and persistence stay with the editor component.
 */
export const createEditorExtensions = ({
  starterKit,
  placeholder,
  extensions = [],
}: CreateEditorExtensionsOptions = {}): Extensions => {
  const editorExtensions: Extensions = [StarterKit.configure(starterKit)];

  if (placeholder !== undefined) {
    editorExtensions.push(Placeholder.configure({ placeholder }));
  }

  return [...editorExtensions, ...extensions];
};
