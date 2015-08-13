use strict;
use warnings;

use Data::Dumper;
use GO::Parser;
use JSON;

my $json = JSON->new;

my $parser = new GO::Parser({handler=>'obj',use_cache=>1});

$parser->parse($ARGV[0]);

my $graph = $parser->handler->graph;

my $output={};
my @arr;

$graph->iterate(sub {
	my $ni=shift;
	if($ni->{term}->{is_root} &&
      !$ni->{term}->{is_obsolete} &&
      !$ni->{term}->{is_relationship_type})
    {
		$output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        push(@arr,$output);
        $output={};
	}
	if(!$ni->{term}->{is_root} &&
       !$ni->{term}->{is_obsolete} &&
       !$ni->{term}->{is_relationship_type})
    {
        $output->{label}=$ni->{term}->{acc};
        $output->{description}=$ni->{term}->{name};
        $output->{parent}=$ni->{parent_rel}->{acc1};
        push(@arr,$output);
        $output={};
	}
});

print $json->encode(\@arr) . "\n";

