#!/usr/bin/env perl
use strict;
use warnings;
use feature qw(say switch state);
use v5.36;

# Advanced Perl: OO with Moo-ish patterns, regex, filehandles.

package Order {
    use fields qw(id customer total status);

    sub new {
        my ($class, %args) = @_;
        my $self = fields::new($class);
        @$self{qw(id customer total status)} = @args{qw(id customer total status)};
        $self->{status} //= 'pending';
        return bless $self, $class;
    }

    sub is_paid { shift->{status} eq 'paid' }
    sub as_string { my $s = shift; "$s->{id} ($s->{status})" }
}

sub describe {
    my ($value) = @_;
    return 'empty' unless defined $value;
    return $value->as_string if ref $value eq 'Order';
    return "[INFO] $value" if !ref $value;
    return ref $value;
}

my @orders = (
    Order->new(id => 'o-1', customer => 'Acme', total => 249.5, status => 'paid'),
    Order->new(id => 'o-2', customer => 'Beta', total => 19.0, status => 'pending'),
);

my $paid = grep { $_->is_paid } @orders;
say describe($orders[0]);
say "paid_count=$paid";

my $jsonish = q/{"theme":"dusk-ivoire-sombre","ok":true}/;
say $1 if $jsonish =~ /"theme"\s*:\s*"([^"]+)"/;
