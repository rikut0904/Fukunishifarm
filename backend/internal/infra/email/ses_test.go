package email

import "testing"

func TestFormatFromAddress(t *testing.T) {
	t.Parallel()

	got := formatFromAddress("ふくにしファーム", "noreply@example.com")
	want := "=?utf-8?q?=E3=81=B5=E3=81=8F=E3=81=AB=E3=81=97=E3=83=95=E3=82=A1=E3=83=BC?= =?utf-8?q?=E3=83=A0?= <noreply@example.com>"
	if got != want {
		t.Fatalf("formatFromAddress() = %q, want %q", got, want)
	}
}

func TestFormatFromAddressWithoutName(t *testing.T) {
	t.Parallel()

	got := formatFromAddress("", "noreply@example.com")
	want := "noreply@example.com"
	if got != want {
		t.Fatalf("formatFromAddress() = %q, want %q", got, want)
	}
}
