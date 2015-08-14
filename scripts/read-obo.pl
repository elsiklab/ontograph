use strict;
use warnings;

use Data::Dumper;
use GO::Parser;
use JSON;

my $json = JSON->new;

my $parser = new GO::Parser({handler=>'obj',use_cache=>1});

$parser->parse($ARGV[0]);

my $graph = $parser->handler->graph;

my $output_graph = {};

$graph->iterate(sub {
    my $ni=shift;
    my $output={};
    if($ni->{term}->{is_root} &&
      !$ni->{term}->{is_obsolete} &&
      !$ni->{term}->{is_relationship_type})
    {
        $output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        $output_graph->{$ni->{term}->{acc}}=$output;
    }
    if(!$ni->{term}->{is_root} &&
       !$ni->{term}->{is_obsolete} &&
       !$ni->{term}->{is_relationship_type})
    {
        my $term_lref = $graph->get_parent_terms($ni->{term}->{acc});
        my @parent_terms = map { $_->{acc} } @$term_lref;
        $output->{parents}=\@parent_terms;
        $output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        $output_graph->{$ni->{term}->{acc}}=$output;
    }
});

print $json->encode($output_graph) . "\n";

