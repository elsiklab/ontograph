use strict;
use warnings;

use Data::Dumper;
use GO::Parser;
use JSON;

my $json = JSON->new;

my $parser = new GO::Parser({handler=>'obj',use_cache=>1});

$parser->parse($ARGV[0]);

my $graph = $parser->handler->graph;

my @arr;

$graph->iterate(sub {
    my $ni=shift;
    my $output={};
    if($ni->{term}->{is_root} &&
      !$ni->{term}->{is_obsolete} &&
      !$ni->{term}->{is_relationship_type})
    {
        $output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        push(@arr,$output);
    }
    if(!$ni->{term}->{is_root} &&
       !$ni->{term}->{is_obsolete} &&
       !$ni->{term}->{is_relationship_type})
    {
        my @parent_terms;
        my $term_lref = $graph->get_parent_terms($ni->{term}->{acc});
        $output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        foreach my $term (@$term_lref) {
           push(@parent_terms, $term->{acc}); 
        }
        $output->{parents}=\@parent_terms;
        push(@arr,$output);
    }
});

print $json->encode(\@arr) . "\n";

