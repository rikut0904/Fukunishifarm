package email

import (
	"net/mail"
	"testing"
)

func TestFormatFromAddress(t *testing.T) {
	t.Parallel()

	got := formatFromAddress("ふくにしファーム", "noreply@example.com")
	addr, err := mail.ParseAddress(got)
	if err != nil {
		t.Fatalf("ParseAddress(%q) returned error: %v", got, err)
	}
	if addr.Name != "ふくにしファーム" {
		t.Fatalf("ParseAddress(%q).Name = %q, want %q", got, addr.Name, "ふくにしファーム")
	}
	if addr.Address != "noreply@example.com" {
		t.Fatalf("ParseAddress(%q).Address = %q, want %q", got, addr.Address, "noreply@example.com")
	}
}

func TestFormatFromAddressWithoutName(t *testing.T) {
	t.Parallel()

	got := formatFromAddress("", "noreply@example.com")
	addr, err := mail.ParseAddress(got)
	if err != nil {
		t.Fatalf("ParseAddress(%q) returned error: %v", got, err)
	}
	if addr.Name != "" {
		t.Fatalf("ParseAddress(%q).Name = %q, want empty", got, addr.Name)
	}
	if addr.Address != "noreply@example.com" {
		t.Fatalf("ParseAddress(%q).Address = %q, want %q", got, addr.Address, "noreply@example.com")
	}
}
