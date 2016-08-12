#!/usr/bin/env perl

use Data::Dumper;
use List::MoreUtils;
use GO::Parser;
use JSON;
use Carp;
$SIG{__DIE__} = sub { Carp::confess(@_) };

my $parser = new GO::Parser({handler => 'obj', use_cache => 1});

$parser->parse($ARGV[0]);

my $graph = $parser->handler->graph;

my $output_graph = {};

$graph->iterate(
    sub {
        my $ni     = shift;
        my $output = {};
        if (   $ni->{term}->{is_root}
            && !$ni->{term}->{is_obsolete})
        {
            $output->{description} = $ni->{term}->{name};
            $output_graph->{$ni->{term}->{acc}} = $output;
        }
        if (   !$ni->{term}->{is_root}
            && !$ni->{term}->{is_obsolete})
        {
            my $term_lref = $graph->get_parent_terms($ni->{term}->{acc});
            my @parent_terms = map { $_->{acc} } @$term_lref;
            $output->{parents}     = \@parent_terms;
            $output->{description} = $ni->{term}->{name};
            my $relationships =
              $graph->get_parent_relationships($ni->{term}->{acc});
            foreach (@$relationships) {
                if ($_->{type} && $_->{type} ne "is_a") {
                    if (!$output->{$_->{type}}) {
                        $output->{$_->{type}} = [];
                    }
                    push(@{$output->{$_->{type}}}, $_->{acc1})
                      unless grep { $_ eq $_->{acc1} } @{$output->{$_->{type}}};
                }
            }

            $output_graph->{$ni->{term}->{acc}} = $output;
        }
    }
);

print to_json($output_graph, {allow_blessed => 1}) . "\n";

