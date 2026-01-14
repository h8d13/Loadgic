// Simple TypeScript preset for future parser tests.
const greeting: string = "Hello, world!";
const count: number = 3;

function repeatMessage(message: string, times: number): string[] {
  return Array.from({ length: times }, () => message);
}

const messages = repeatMessage(greeting, count);
messages.forEach((message, index) => {
  console.log(`#${index + 1}: ${message}`);
});
